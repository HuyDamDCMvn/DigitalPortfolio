import type { Metadata } from "next";
import { SkillsSurveyForm } from "./survey-form";

export const metadata: Metadata = {
  title: "MEP Revit Skills Survey — Digital Team",
  description: "Self-assessment survey from the DCMvn MEP Revit skills matrix. Rate 98 skills from 0 to 5.",
};

export default function SkillsSurveyPage() {
  return <SkillsSurveyForm />;
}
