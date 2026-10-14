/** What the student did at one checkpoint. Kept by the player so stepping back and forth keeps it. */
export type CheckpointRecord = {
  /** Wrong choices already tried, in order. */
  ruledOut: string[];
  correct: boolean;
  /** The student moved past the checkpoint (after answering, or by choosing to skip). */
  revealed: boolean;
};

export const emptyRecord: CheckpointRecord = { ruledOut: [], correct: false, revealed: false };
