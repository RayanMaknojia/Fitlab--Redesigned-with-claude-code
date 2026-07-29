import * as exerciseTemplateModel from "../models/ExerciseTemplate";
import { requireResourceOwnerAccess } from "../utils/clientAccess";

export const requireExerciseTemplateAccess = requireResourceOwnerAccess(
  "templateId",
  "Cannot find template.",
  exerciseTemplateModel.getExerciseTemplate,
  (template) => template.client_id,
);
