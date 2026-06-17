-- Phase 5: Realtime Notifications System
-- Creates notifications table, helper function, and triggers on job_invitations, interview_rounds, job_offers

-- ============================================================================
-- 1. Create notifications table with RLS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL, -- 'invitation_received', 'invitation_accepted', 'interview_scheduled', 'offer_received', etc.
  title        TEXT NOT NULL,
  body         TEXT,
  data         JSONB, -- Additional context: {invitation_id, round_id, offer_id, etc.}
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create partial index for unread notifications (most common query)
CREATE INDEX IF NOT EXISTS notifications_user_id_unread_idx
  ON public.notifications (user_id, is_read, created_at DESC)
  WHERE is_read = false;

-- Create index for all notifications (for history view)
CREATE INDEX IF NOT EXISTS notifications_user_id_created_at_idx
  ON public.notifications (user_id, created_at DESC);

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own notifications
CREATE POLICY "own_notifications" 
  ON public.notifications
  FOR ALL 
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 2. Create helper function to insert notifications
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_user(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_data JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Insert notification and return the ID
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_data)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- ============================================================================
-- 3. Trigger functions for automatic notifications
-- ============================================================================

-- 3a. Notify on job invitation INSERT (candidate + employer)
CREATE OR REPLACE FUNCTION public.notify_on_invitation_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_candidate_id UUID;
  v_employer_id UUID;
  v_job_title TEXT;
BEGIN
  -- Get candidate_id from NEW.candidate_id
  v_candidate_id := NEW.candidate_id;
  
  -- Get employer_id from the job posting
  SELECT jp.posted_by, jp.job_title 
  INTO v_employer_id, v_job_title
  FROM public.job_postings jp
  WHERE jp.id = NEW.job_id;
  
  -- Notify candidate: new invitation received
  PERFORM public.notify_user(
    v_candidate_id,
    'invitation_received',
    'New Job Invitation',
    'You have received an invitation for ' || COALESCE(v_job_title, 'a position'),
    jsonb_build_object(
      'invitation_id', NEW.id,
      'job_id', NEW.job_id,
      'status', NEW.status
    )
  );
  
  -- Notify employer: invitation sent
  IF v_employer_id IS NOT NULL THEN
    PERFORM public.notify_user(
      v_employer_id,
      'invitation_sent',
      'Invitation Sent',
      'Your invitation for ' || COALESCE(v_job_title, 'a position') || ' has been sent',
      jsonb_build_object(
        'invitation_id', NEW.id,
        'job_id', NEW.job_id,
        'candidate_id', v_candidate_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3b. Notify on job invitation status UPDATE
CREATE OR REPLACE FUNCTION public.notify_on_invitation_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_candidate_id UUID;
  v_employer_id UUID;
  v_job_title TEXT;
BEGIN
  -- Only trigger if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_candidate_id := NEW.candidate_id;
    
    -- Get employer_id from the job posting
    SELECT jp.posted_by, jp.job_title 
    INTO v_employer_id, v_job_title
    FROM public.job_postings jp
    WHERE jp.id = NEW.job_id;
    
    -- Notify based on new status
    CASE NEW.status
      WHEN 'accepted' THEN
        -- Notify employer: candidate accepted
        IF v_employer_id IS NOT NULL THEN
          PERFORM public.notify_user(
            v_employer_id,
            'invitation_accepted',
            'Invitation Accepted',
            'Candidate accepted your invitation for ' || COALESCE(v_job_title, 'a position'),
            jsonb_build_object(
              'invitation_id', NEW.id,
              'job_id', NEW.job_id,
              'candidate_id', v_candidate_id
            )
          );
        END IF;
        
      WHEN 'declined' THEN
        -- Notify employer: candidate declined
        IF v_employer_id IS NOT NULL THEN
          PERFORM public.notify_user(
            v_employer_id,
            'invitation_declined',
            'Invitation Declined',
            'Candidate declined your invitation for ' || COALESCE(v_job_title, 'a position'),
            jsonb_build_object(
              'invitation_id', NEW.id,
              'job_id', NEW.job_id,
              'candidate_id', v_candidate_id
            )
          );
        END IF;
        
      WHEN 'cancelled' THEN
        -- Notify candidate: invitation cancelled
        PERFORM public.notify_user(
          v_candidate_id,
          'invitation_cancelled',
          'Invitation Cancelled',
          'The invitation for ' || COALESCE(v_job_title, 'a position') || ' has been cancelled',
          jsonb_build_object(
            'invitation_id', NEW.id,
            'job_id', NEW.job_id
          )
        );
        
      ELSE
        -- No notification for other status changes
        NULL;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3c. Notify on interview round INSERT (new round scheduled)
CREATE OR REPLACE FUNCTION public.notify_on_round_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_candidate_id UUID;
  v_employer_id UUID;
  v_job_title TEXT;
BEGIN
  -- Get candidate and employer from the invitation
  SELECT 
    ji.candidate_id, 
    jp.posted_by,
    jp.job_title
  INTO v_candidate_id, v_employer_id, v_job_title
  FROM public.job_invitations ji
  JOIN public.job_postings jp ON jp.id = ji.job_id
  WHERE ji.id = NEW.invitation_id;
  
  -- Notify candidate: new interview round scheduled
  IF v_candidate_id IS NOT NULL THEN
    PERFORM public.notify_user(
      v_candidate_id,
      'interview_scheduled',
      'Interview Scheduled',
      'Round ' || NEW.round_number || ' scheduled for ' || COALESCE(v_job_title, 'a position'),
      jsonb_build_object(
        'round_id', NEW.id,
        'invitation_id', NEW.invitation_id,
        'round_number', NEW.round_number,
        'scheduled_at', NEW.scheduled_at,
        'type', NEW.type
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3d. Notify on interview round status UPDATE
CREATE OR REPLACE FUNCTION public.notify_on_round_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_candidate_id UUID;
  v_employer_id UUID;
  v_job_title TEXT;
BEGIN
  -- Only trigger if status or scheduled_at changed
  IF OLD.status IS DISTINCT FROM NEW.status OR OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at THEN
    -- Get candidate and employer from the invitation
    SELECT 
      ji.candidate_id, 
      jp.posted_by,
      jp.job_title
    INTO v_candidate_id, v_employer_id, v_job_title
    FROM public.job_invitations ji
    JOIN public.job_postings jp ON jp.id = ji.job_id
    WHERE ji.id = NEW.invitation_id;
    
    -- Notify based on status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      CASE NEW.status
        WHEN 'confirmed' THEN
          -- Notify both parties: interview confirmed
          IF v_candidate_id IS NOT NULL THEN
            PERFORM public.notify_user(
              v_candidate_id,
              'interview_confirmed',
              'Interview Confirmed',
              'Round ' || NEW.round_number || ' confirmed for ' || COALESCE(v_job_title, 'a position'),
              jsonb_build_object(
                'round_id', NEW.id,
                'invitation_id', NEW.invitation_id,
                'round_number', NEW.round_number,
                'scheduled_at', NEW.scheduled_at
              )
            );
          END IF;
          
          IF v_employer_id IS NOT NULL THEN
            PERFORM public.notify_user(
              v_employer_id,
              'interview_confirmed',
              'Interview Confirmed',
              'Candidate confirmed Round ' || NEW.round_number || ' for ' || COALESCE(v_job_title, 'a position'),
              jsonb_build_object(
                'round_id', NEW.id,
                'invitation_id', NEW.invitation_id,
                'candidate_id', v_candidate_id
              )
            );
          END IF;
          
        WHEN 'cancelled' THEN
          -- Notify both parties: interview cancelled
          IF v_candidate_id IS NOT NULL THEN
            PERFORM public.notify_user(
              v_candidate_id,
              'interview_cancelled',
              'Interview Cancelled',
              'Round ' || NEW.round_number || ' has been cancelled for ' || COALESCE(v_job_title, 'a position'),
              jsonb_build_object('round_id', NEW.id)
            );
          END IF;
          
          IF v_employer_id IS NOT NULL THEN
            PERFORM public.notify_user(
              v_employer_id,
              'interview_cancelled',
              'Interview Cancelled',
              'Round ' || NEW.round_number || ' cancelled for ' || COALESCE(v_job_title, 'a position'),
              jsonb_build_object('round_id', NEW.id, 'candidate_id', v_candidate_id)
            );
          END IF;
          
        WHEN 'completed' THEN
          -- Notify employer: interview completed
          IF v_employer_id IS NOT NULL THEN
            PERFORM public.notify_user(
              v_employer_id,
              'interview_completed',
              'Interview Completed',
              'Round ' || NEW.round_number || ' completed for ' || COALESCE(v_job_title, 'a position'),
              jsonb_build_object(
                'round_id', NEW.id,
                'candidate_id', v_candidate_id
              )
            );
          END IF;
          
        ELSE
          NULL;
      END CASE;
    END IF;
    
    -- Notify if interview was rescheduled
    IF OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at AND NEW.status != 'cancelled' THEN
      IF v_candidate_id IS NOT NULL THEN
        PERFORM public.notify_user(
          v_candidate_id,
          'interview_rescheduled',
          'Interview Rescheduled',
          'Round ' || NEW.round_number || ' has been rescheduled for ' || COALESCE(v_job_title, 'a position'),
          jsonb_build_object(
            'round_id', NEW.id,
            'old_time', OLD.scheduled_at,
            'new_time', NEW.scheduled_at
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3e. Notify on job offer INSERT and UPDATE
CREATE OR REPLACE FUNCTION public.notify_on_offer_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_candidate_id UUID;
  v_job_title TEXT;
BEGIN
  -- Get candidate from invitation
  SELECT ji.candidate_id, jp.job_title
  INTO v_candidate_id, v_job_title
  FROM public.job_invitations ji
  JOIN public.job_postings jp ON jp.id = ji.job_id
  WHERE ji.id = NEW.invitation_id;
  
  -- Notify candidate: new job offer received
  IF v_candidate_id IS NOT NULL THEN
    PERFORM public.notify_user(
      v_candidate_id,
      'offer_received',
      'Job Offer Received',
      'You have received an offer for ' || COALESCE(v_job_title, 'a position'),
      jsonb_build_object(
        'offer_id', NEW.id,
        'invitation_id', NEW.invitation_id,
        'salary', NEW.salary,
        'currency', NEW.currency
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_offer_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_candidate_id UUID;
  v_employer_id UUID;
  v_job_title TEXT;
BEGIN
  -- Only trigger if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get candidate and employer from invitation
    SELECT 
      ji.candidate_id, 
      jp.posted_by,
      jp.job_title
    INTO v_candidate_id, v_employer_id, v_job_title
    FROM public.job_invitations ji
    JOIN public.job_postings jp ON jp.id = ji.job_id
    WHERE ji.id = NEW.invitation_id;
    
    -- Notify based on status
    CASE NEW.status
      WHEN 'accepted' THEN
        -- Notify employer: offer accepted
        IF v_employer_id IS NOT NULL THEN
          PERFORM public.notify_user(
            v_employer_id,
            'offer_accepted',
            'Offer Accepted',
            'Candidate accepted your offer for ' || COALESCE(v_job_title, 'a position'),
            jsonb_build_object(
              'offer_id', NEW.id,
              'invitation_id', NEW.invitation_id,
              'candidate_id', v_candidate_id
            )
          );
        END IF;
        
      WHEN 'declined' THEN
        -- Notify employer: offer declined
        IF v_employer_id IS NOT NULL THEN
          PERFORM public.notify_user(
            v_employer_id,
            'offer_declined',
            'Offer Declined',
            'Candidate declined your offer for ' || COALESCE(v_job_title, 'a position'),
            jsonb_build_object(
              'offer_id', NEW.id,
              'invitation_id', NEW.invitation_id,
              'candidate_id', v_candidate_id
            )
          );
        END IF;
        
      WHEN 'withdrawn' THEN
        -- Notify candidate: offer withdrawn
        IF v_candidate_id IS NOT NULL THEN
          PERFORM public.notify_user(
            v_candidate_id,
            'offer_withdrawn',
            'Offer Withdrawn',
            'The offer for ' || COALESCE(v_job_title, 'a position') || ' has been withdrawn',
            jsonb_build_object(
              'offer_id', NEW.id,
              'invitation_id', NEW.invitation_id
            )
          );
        END IF;
        
      ELSE
        NULL;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. Create triggers
-- ============================================================================

-- Triggers on job_invitations
DROP TRIGGER IF EXISTS trigger_notify_invitation_insert ON public.job_invitations;
CREATE TRIGGER trigger_notify_invitation_insert
  AFTER INSERT ON public.job_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_invitation_insert();

DROP TRIGGER IF EXISTS trigger_notify_invitation_update ON public.job_invitations;
CREATE TRIGGER trigger_notify_invitation_update
  AFTER UPDATE ON public.job_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_invitation_update();

-- Triggers on interview_rounds
DROP TRIGGER IF EXISTS trigger_notify_round_insert ON public.interview_rounds;
CREATE TRIGGER trigger_notify_round_insert
  AFTER INSERT ON public.interview_rounds
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_round_insert();

DROP TRIGGER IF EXISTS trigger_notify_round_update ON public.interview_rounds;
CREATE TRIGGER trigger_notify_round_update
  AFTER UPDATE ON public.interview_rounds
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_round_update();

-- Triggers on job_offers
DROP TRIGGER IF EXISTS trigger_notify_offer_insert ON public.job_offers;
CREATE TRIGGER trigger_notify_offer_insert
  AFTER INSERT ON public.job_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_offer_insert();

DROP TRIGGER IF EXISTS trigger_notify_offer_update ON public.job_offers;
CREATE TRIGGER trigger_notify_offer_update
  AFTER UPDATE ON public.job_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_offer_update();

-- ============================================================================
-- Phase 5 Complete
-- ============================================================================
-- This migration adds:
-- 1. notifications table with RLS (users can only see their own)
-- 2. notify_user() helper function (SECURITY DEFINER)
-- 3. Automatic triggers on job_invitations, interview_rounds, job_offers
-- Next steps: 
-- - Create useNotifications hook (Realtime subscription)
-- - Create NotificationBell component
-- - Add to candidate and employer dashboards
