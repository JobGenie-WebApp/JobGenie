-- Enable REPLICA IDENTITY FULL so UPDATE and DELETE events carry old row values
-- Required for Supabase Realtime postgres_changes subscriptions
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE job_invitations REPLICA IDENTITY FULL;
ALTER TABLE payment_requests REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE job_invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_requests;
