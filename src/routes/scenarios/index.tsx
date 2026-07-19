import { createFileRoute } from '@tanstack/react-router';
import { ScenarioListPage } from '../../features/session-start/ScenarioListPage';

export const Route = createFileRoute('/scenarios/')({ component: ScenarioListPage });
