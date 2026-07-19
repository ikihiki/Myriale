import { createFileRoute } from '@tanstack/react-router';
import { EditScenarioPage } from '../../../features/scenario-editor/EditScenarioPage';
export const Route = createFileRoute('/scenarios/$scenarioId/edit')({ component: EditScenarioPage });
