import { createFileRoute } from '@tanstack/react-router';
import { SessionListContainer } from '../../features/session-list/SessionListContainer';

export const Route = createFileRoute('/sessions/')({ component: SessionListContainer });
