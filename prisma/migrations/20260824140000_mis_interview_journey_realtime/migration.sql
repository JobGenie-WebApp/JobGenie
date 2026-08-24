-- MIS interview monitoring must receive child-table changes as well as invitation changes.
ALTER TABLE public.interview_rounds REPLICA IDENTITY FULL;
ALTER TABLE public.job_offers REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'interview_rounds'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.interview_rounds';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'job_offers'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.job_offers';
    END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.notify_mis_interview_journey()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_invitation_id uuid;
    event_text text;
    candidate_name text;
    company_name text;
    role_name text;
BEGIN
    IF TG_TABLE_NAME = 'job_invitations' THEN
        v_invitation_id := NEW.id;
        IF TG_OP = 'INSERT' THEN
            event_text := 'Invitation created';
        ELSIF OLD.pipeline_status IS DISTINCT FROM NEW.pipeline_status THEN
            event_text := 'Pipeline changed to ' || NEW.pipeline_status::text;
        ELSIF OLD.invitation_canceled IS DISTINCT FROM NEW.invitation_canceled AND NEW.invitation_canceled THEN
            event_text := 'Interview cancelled by ' || COALESCE(NEW.canceled_by::text, 'unknown');
        ELSIF OLD.interview_confirmed IS DISTINCT FROM NEW.interview_confirmed AND NEW.interview_confirmed THEN
            event_text := 'Interview confirmed';
        ELSIF OLD.current_round_number IS DISTINCT FROM NEW.current_round_number THEN
            event_text := 'Advanced to round ' || NEW.current_round_number;
        ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
            event_text := 'Invitation status changed to ' || NEW.status::text;
        ELSIF OLD.responded_at IS DISTINCT FROM NEW.responded_at THEN
            event_text := 'Candidate responded to invitation';
        ELSIF OLD.viewed_at IS DISTINCT FROM NEW.viewed_at THEN
            event_text := 'Candidate viewed invitation';
        ELSE
            RETURN NEW;
        END IF;
    ELSIF TG_TABLE_NAME = 'interview_rounds' THEN
        v_invitation_id := NEW.invitation_id;
        IF TG_OP = 'INSERT' THEN
            event_text := COALESCE(NEW.round_label, 'Round ' || NEW.round_number) || ' created';
        ELSIF OLD.assessment_submitted_at IS DISTINCT FROM NEW.assessment_submitted_at AND NEW.assessment_submitted_at IS NOT NULL THEN
            event_text := COALESCE(NEW.round_label, 'Round ' || NEW.round_number) || ' assessment submitted';
        ELSIF OLD.outcome IS DISTINCT FROM NEW.outcome AND NEW.outcome IS NOT NULL THEN
            event_text := COALESCE(NEW.round_label, 'Round ' || NEW.round_number) || ' outcome: ' || NEW.outcome::text;
        ELSIF OLD.round_canceled IS DISTINCT FROM NEW.round_canceled AND NEW.round_canceled THEN
            event_text := COALESCE(NEW.round_label, 'Round ' || NEW.round_number) || ' cancelled';
        ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
            event_text := COALESCE(NEW.round_label, 'Round ' || NEW.round_number) || ' status: ' || NEW.status::text;
        ELSIF OLD.selected_time_slot IS DISTINCT FROM NEW.selected_time_slot THEN
            event_text := COALESCE(NEW.round_label, 'Round ' || NEW.round_number) || ' schedule updated';
        ELSE
            event_text := COALESCE(NEW.round_label, 'Round ' || NEW.round_number) || ' updated';
        END IF;
    ELSIF TG_TABLE_NAME = 'job_offers' THEN
        v_invitation_id := NEW.invitation_id;
        IF TG_OP = 'INSERT' THEN
            event_text := 'Job offer created';
        ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
            event_text := 'Job offer status changed to ' || NEW.status::text;
        ELSE
            event_text := 'Job offer updated';
        END IF;
    ELSE
        RETURN NEW;
    END IF;

    SELECT
        trim(concat_ws(' ', candidate.first_name, candidate.last_name)),
        company.company_name,
        invitation.job_designation
    INTO candidate_name, company_name, role_name
    FROM public.job_invitations AS invitation
    JOIN public.candidates AS candidate ON candidate.id = invitation.candidate_id
    JOIN public.companies AS company ON company.id = invitation.company_id
    WHERE invitation.id = v_invitation_id;

    INSERT INTO public.notifications (user_id, type, title, body, data)
    SELECT
        mis.user_id,
        'mis_interview_updated',
        'Interview Journey Updated',
        concat_ws(' · ', company_name, candidate_name, role_name) || ' — ' || event_text,
        jsonb_build_object(
            'invitation_id', v_invitation_id,
            'source_table', TG_TABLE_NAME,
            'source_id', NEW.id,
            'event', event_text
        )
    FROM public.mis_user AS mis
    WHERE mis.user_id IS DISTINCT FROM (SELECT auth.uid());

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.notify_mis_interview_journey() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_mis_interview_journey_invitation ON public.job_invitations;
CREATE TRIGGER notify_mis_interview_journey_invitation
AFTER INSERT OR UPDATE ON public.job_invitations
FOR EACH ROW EXECUTE FUNCTION private.notify_mis_interview_journey();

DROP TRIGGER IF EXISTS notify_mis_interview_journey_round ON public.interview_rounds;
CREATE TRIGGER notify_mis_interview_journey_round
AFTER INSERT OR UPDATE ON public.interview_rounds
FOR EACH ROW EXECUTE FUNCTION private.notify_mis_interview_journey();

DROP TRIGGER IF EXISTS notify_mis_interview_journey_offer ON public.job_offers;
CREATE TRIGGER notify_mis_interview_journey_offer
AFTER INSERT OR UPDATE ON public.job_offers
FOR EACH ROW EXECUTE FUNCTION private.notify_mis_interview_journey();

-- Other operational milestones that MIS must not have to discover manually.
CREATE OR REPLACE FUNCTION private.notify_mis_operational_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    event_text text;
    notification_type text;
    notification_title text;
    resource_id uuid;
    event_data jsonb;
BEGIN
    resource_id := NEW.id;

    IF TG_TABLE_NAME = 'candidates' THEN
        notification_type := 'mis_candidate_updated';
        notification_title := 'Candidate Update';
        IF TG_OP = 'INSERT' THEN
            event_text := trim(concat_ws(' ', NEW.first_name, NEW.last_name)) || ' registered';
        ELSIF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
            event_text := trim(concat_ws(' ', NEW.first_name, NEW.last_name)) || ' approval: ' || NEW.approval_status::text;
        ELSE
            RETURN NEW;
        END IF;
        event_data := jsonb_build_object('candidate_id', NEW.id);
    ELSIF TG_TABLE_NAME = 'employers' THEN
        notification_type := 'mis_employer_updated';
        notification_title := 'Employer Update';
        IF TG_OP = 'INSERT' THEN
            event_text := trim(concat_ws(' ', NEW.first_name, NEW.last_name)) || ' registered';
        ELSE
            RETURN NEW;
        END IF;
        event_data := jsonb_build_object('employer_id', NEW.id, 'company_id', NEW.company_id);
    ELSIF TG_TABLE_NAME = 'companies' THEN
        notification_type := 'mis_employer_updated';
        notification_title := 'Company Update';
        IF TG_OP = 'INSERT' THEN
            event_text := NEW.company_name || ' registered';
        ELSIF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
            event_text := NEW.company_name || ' approval: ' || NEW.approval_status::text;
        ELSE
            RETURN NEW;
        END IF;
        event_data := jsonb_build_object('company_id', NEW.id);
    ELSIF TG_TABLE_NAME = 'jobs' THEN
        notification_type := 'mis_job_updated';
        notification_title := 'Job Update';
        IF TG_OP = 'INSERT' THEN
            event_text := NEW.job_title || ' created';
        ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
            event_text := NEW.job_title || ' status: ' || NEW.status::text;
        ELSIF OLD.is_deleted IS DISTINCT FROM NEW.is_deleted AND NEW.is_deleted THEN
            event_text := NEW.job_title || ' deleted';
        ELSE
            RETURN NEW;
        END IF;
        event_data := jsonb_build_object('job_id', NEW.id, 'company_id', NEW.company_id);
    ELSIF TG_TABLE_NAME = 'job_applications' THEN
        notification_type := 'mis_application_updated';
        notification_title := 'Application Update';
        IF TG_OP = 'INSERT' THEN
            event_text := 'New job application submitted';
        ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
            event_text := 'Application status changed to ' || NEW.status::text;
        ELSE
            RETURN NEW;
        END IF;
        event_data := jsonb_build_object('application_id', NEW.id, 'job_id', NEW.job_id, 'candidate_id', NEW.candidate_id);
    ELSIF TG_TABLE_NAME = 'payment_requests' THEN
        notification_type := 'mis_payment_updated';
        notification_title := 'Payment Update';
        IF TG_OP = 'INSERT' THEN
            event_text := concat('Payment request created for ', NEW.currency, ' ', NEW.amount);
        ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
            event_text := 'Payment request status changed to ' || NEW.status::text;
        ELSE
            RETURN NEW;
        END IF;
        event_data := jsonb_build_object('payment_request_id', NEW.id, 'company_id', NEW.company_id);
    ELSE
        RETURN NEW;
    END IF;

    INSERT INTO public.notifications (user_id, type, title, body, data)
    SELECT mis.user_id, notification_type, notification_title, event_text, event_data
    FROM public.mis_user AS mis
    WHERE mis.user_id IS DISTINCT FROM (SELECT auth.uid());

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.notify_mis_operational_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_mis_candidate_change ON public.candidates;
CREATE TRIGGER notify_mis_candidate_change
AFTER INSERT OR UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION private.notify_mis_operational_change();

DROP TRIGGER IF EXISTS notify_mis_employer_change ON public.employers;
CREATE TRIGGER notify_mis_employer_change
AFTER INSERT OR UPDATE ON public.employers
FOR EACH ROW EXECUTE FUNCTION private.notify_mis_operational_change();

DROP TRIGGER IF EXISTS notify_mis_company_change ON public.companies;
CREATE TRIGGER notify_mis_company_change
AFTER INSERT OR UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION private.notify_mis_operational_change();

DROP TRIGGER IF EXISTS notify_mis_job_change ON public.jobs;
CREATE TRIGGER notify_mis_job_change
AFTER INSERT OR UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION private.notify_mis_operational_change();

DROP TRIGGER IF EXISTS notify_mis_application_change ON public.job_applications;
CREATE TRIGGER notify_mis_application_change
AFTER INSERT OR UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION private.notify_mis_operational_change();

DROP TRIGGER IF EXISTS notify_mis_payment_change ON public.payment_requests;
CREATE TRIGGER notify_mis_payment_change
AFTER INSERT OR UPDATE ON public.payment_requests
FOR EACH ROW EXECUTE FUNCTION private.notify_mis_operational_change();
