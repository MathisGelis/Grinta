import { WorkoutTheme } from "@/constants/Colors";

export const selectStyles = {
  inputStyles: { color: WorkoutTheme.text.primary },
  boxStyles: {
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderWidth: 0,
    borderRadius: 28,
    paddingHorizontal: 20,
    height: 56,
    alignItems: "center" as const,
  },
  dropdownStyles: {
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderWidth: 0,
    borderRadius: 22,
    marginTop: 8,
  },
  dropdownItemStyles: {
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderBottomWidth: 0,
  },
  dropdownTextStyles: { color: WorkoutTheme.text.primary },
};
