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
    // Se superpose au contenu suivant au lieu d'agrandir le champ.
    position: "absolute" as const,
    top: 56,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 12,
  },
  dropdownItemStyles: {
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderBottomWidth: 0,
  },
  dropdownTextStyles: { color: WorkoutTheme.text.primary },
};
