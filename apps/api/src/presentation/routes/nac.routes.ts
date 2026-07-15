import { Router } from 'express';
import type { NacController } from '../controllers/NacController';
import { verifyAgentSecret } from '../middlewares/verifyAgentSecret';
import { validateRecordSighting } from '../validators/nac.validator';

export function createNacRoutes(controller: NacController): Router {
  const router = Router();
  router.post('/sightings', verifyAgentSecret, validateRecordSighting, controller.recordSighting);
  return router;
}
