export type JointPainLevel = 0 | 1 | 2 | 3 | 4;

export type JointPainOption = {
  level: JointPainLevel;
  label: string;
  description: string;
};

export const JOINT_PAIN_OPTIONS: Array<JointPainOption> = [
  {
    level: 0,
    label: "None",
    description: "My joints felt great, no problems.",
  },
  {
    level: 1,
    label: "Low pain",
    description:
      "My joints felt ok, but I can definitely feel them being loaded.",
  },
  {
    level: 2,
    label: "Moderate pain",
    description:
      "My joints are taking a bit of a beating. They definitely don't love this exercise right now.",
  },
  {
    level: 3,
    label: "A lot of pain",
    description: "My joints hurt BAD, something is up.",
  },
  {
    level: 4,
    label: "Severe",
    description: "Sharp or persistent pain — I need to stop or swap this exercise.",
  },
];
