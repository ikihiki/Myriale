import { createFileRoute } from '@tanstack/react-router';
import { SessionResumePage } from '../../../features/session-resume/SessionResumePage';
export const Route = createFileRoute('/sessions/$sessionId/resume')({ component: SessionResumePage });
