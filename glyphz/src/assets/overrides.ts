import type { GlobalThemeOverrides } from 'naive-ui'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    textColor1: 'rgba(255, 255, 255, 0.85)',
    textColor2: 'rgba(255, 255, 255, 0.65)',
    textColor3: 'rgba(255, 255, 255, 0.5)',
  },
  Button: {
    colorOpacitySecondary: '0.15',
    colorSecondary: 'rgba(0, 0, 0, 0.15)',
    colorSecondaryHover: 'rgba(0, 0, 0, 0.35)',
    colorSecondaryPressed: 'rgba(0, 0, 0, 0.5)',
    colorTertiary: 'rgba(0, 0, 0, 0.15)',
    colorTertiaryHover: 'rgba(0, 0, 0, 0.35)',
    colorTertiaryPressed: 'rgba(0, 0, 0, 0.5)',
    borderRadiusMedium: '17px',
    borderRadiusLarge: '20px',
  },
  Card: {
    color: 'rgba(0, 0, 0, 0.15)',
    borderColor: 'none',
    borderRadius: '16px',
  },
  Collapse: {
    dividerColor: 'rgba(255, 255, 255, 0.15)',
  },
  Divider: {
    color: 'rgba(255, 255, 255, 0.2)',
  },
  Typography: {
    codeColor: 'rgba(0, 0, 0, 0.15)',
  },

  Input: {
    color: 'rgba(0, 0, 0, 0.15)',
    colorFocus: 'rgba(0, 0, 0, 0.35)',
    border: 'none',
    borderHover: 'none',
    borderFocus: 'none',
    boxShadowFocus: 'none',
    borderRadius: '16px',
  },
  Checkbox: {
    color: 'rgba(0, 0, 0, 0.15)',
    border: 'rgba(0, 0, 0, 0.15)',
    borderFocus: 'rgba(0, 0, 0, 0.35)',
    boxShadowFocus: 'none',
  },
  Slider: {
    handleColor: 'transparent',
    handleBoxShadow: 'none',
    handleBoxShadowHover: 'none',
    handleBoxShadowFocus: 'none',
    handleBoxShadowActive: 'none',
    railHeight: '34px',
    railColor: 'rgba(0, 0, 0, 0.15)',
    railColorHover: 'rgba(0, 0, 0, 0.35)',
  },

  List: {
    color: 'transparent',
    colorHover: 'transparent',
    borderColor: 'transparent',
    colorModal: 'transparent',
    colorHoverModal: 'rgba(0, 0, 0, 0.15)',
    borderColorModal: 'transparent',
    borderRadius: '16px',
  },

  Pagination: {
    itemColor: 'rgba(0, 0, 0, 0.15)',
    itemColorHover: 'rgba(0, 0, 0, 0.35)',
    itemColorPressed: 'rgba(0, 0, 0, 0.55)',
    itemColorDisabled: 'rgba(0, 0, 0, 0.15)',
  },

  Drawer: {
    color: 'rgba(0, 0, 0, 0.35)',
  },
  Tooltip: {
    borderRadius: '20px',
    color: 'rgba(0, 0, 0, 0.5)',
  },

  Message: {
    color: 'rgba(0, 0, 0, 0.5)',
    colorError: 'rgba(0, 0, 0, 0.5)',
    colorSuccess: 'rgba(0, 0, 0, 0.5)',
    colorLoading: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '16px',
  },
}

export { themeOverrides }
