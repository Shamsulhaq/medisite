export type BlockInstance = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  visible: boolean;
};

export type BlockDefinition = {
  type: string;
  label: string;
  icon: string; // icon name for the admin palette (matches existing Icon component names)
  defaultProps: Record<string, unknown>;
};
