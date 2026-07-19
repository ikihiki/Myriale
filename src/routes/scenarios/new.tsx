import { createFileRoute } from '@tanstack/react-router';
import { ScenarioRegistrationPage } from '../../features/scenario-registration/ScenarioRegistrationPage';
export const Route = createFileRoute('/scenarios/new')({ component: ScenarioRegistrationPage });
