import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Hook to get the appropriate app logo based on current theme
 * @returns {any} Logo image source for current theme
 */
export const useThemeLogo = () => {
  const { theme } = useTheme();

  return useMemo(() => {
    return theme.mode === 'dark'
      ? require('../../assets/ParagonISC App_LOGO_DARK.png')
      : require('../../assets/ParagonISC App_LOGO.png');
  }, [theme.mode]);
};

/**
 * Hook to get the appropriate school logo based on current theme
 * @returns {any} School logo image source for current theme
 */
export const useSchoolLogo = () => {
  const { theme } = useTheme();

  return useMemo(() => {
    return theme.mode === 'dark'
      ? require('../../assets/EduNova School Logo Dark.png')
      : require('../../assets/EduNova School Logo.png');
  }, [theme.mode]);
};

export default useThemeLogo;
