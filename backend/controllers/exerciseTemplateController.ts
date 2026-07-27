import { Request, Response } from "express";
import * as z from "zod";
import * as userModel from "../models/User";
import * as exerciseTemplateModel from "../models/ExerciseTemplate";
import { parseObjectId } from "../utils/parseObjectId";

export const getClientExerciseTemplates = async (
  req: Request,
  res: Response,
) => {
  const client_id = parseObjectId(req.params.clientId);

  if (!client_id) {
    return res.status(400).json({ error: "Invalid client id." });
  }

  const userExists = await userModel.userExists(client_id);

  if (!userExists) {
    return res.status(404).json({ error: "Cannot find client." });
  }

  const templates =
    await exerciseTemplateModel.getAllExerciseTemplatesForClient(client_id);

  res.status(200).json(templates);
};

const TemplateInput = z.object({
  name: z.string(),
});

export const addClientExerciseTemplate = async (
  req: Request,
  res: Response,
) => {
  const result = TemplateInput.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: "Invalid name." });
  }

  const client_id = parseObjectId(req.params.clientId);

  if (!client_id) {
    return res.status(400).json({ error: "Invalid client id." });
  }

  const userExists = await userModel.userExists(client_id);

  if (!userExists) {
    return res.status(404).json({ error: "Cannot find client." });
  }

  const resultId = await exerciseTemplateModel.addExerciseTemplate({
    name: result.data.name,
    client_id,
  });

  res.status(201).json({ _id: resultId, name: result.data.name, client_id });
};

const TemplateNameInput = z.object({
  name: z.string(),
});

export const updateExerciseTemplate = async (req: Request, res: Response) => {
  const templateId = parseObjectId(req.params.templateId);

  if (!templateId) {
    return res.status(400).json({ error: "Invalid template id." });
  }

  const templateExists = await exerciseTemplateModel.templateExists(templateId);

  if (!templateExists) {
    return res.status(404).json({ error: "Cannot find template." });
  }

  const result = TemplateNameInput.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: "Invalid name." });
  }

  await exerciseTemplateModel.updateTemplateById(templateId, result.data.name);
  res.status(200).json({ template_id: templateId, name: result.data.name });
};

export const deleteExerciseTemplate = async (req: Request, res: Response) => {
  const templateId = parseObjectId(req.params.templateId);

  if (!templateId) {
    return res.status(400).json({ error: "Invalid template id." });
  }

  const templateExists = await exerciseTemplateModel.templateExists(templateId);

  if (!templateExists) {
    return res.status(404).json({ error: "Cannot find template." });
  }

  await exerciseTemplateModel.deleteTemplateAndAssociatedExercises(templateId);

  res.status(204).send();
};
