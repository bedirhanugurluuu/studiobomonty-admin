// CSS Debugger - Production'da eksik CSS'leri tespit etmek için
export const checkMissingCSS = () => {
  if (import.meta.env.MODE === 'production') {
    console.log('🔍 CSS Debugger: Checking for missing CSS classes...');
    
    // Test edilecek DaisyUI class'ları
    const testClasses = [
      'menu',
      'menu-title',
      'btn',
      'btn-primary',
      'btn-error',
      'card',
      'input',
      'select',
      'textarea',
      'badge',
      'alert',
      'modal',
      'drawer',
      'dropdown',
      'tooltip',
      'navbar',
      'breadcrumbs',
      'tabs',
    ];
    
    const missingClasses: string[] = [];
    
    testClasses.forEach(className => {
      const testElement = document.createElement('div');
      testElement.className = className;
      document.body.appendChild(testElement);
      
      const styles = window.getComputedStyle(testElement);
      const hasStyles = styles.display !== 'none' || 
                       styles.width !== '0px' || 
                       styles.height !== '0px' ||
                       className.includes('menu'); // Menu için özel kontrol
      
      if (!hasStyles) {
        missingClasses.push(className);
      }
      
      document.body.removeChild(testElement);
    });
    
    if (missingClasses.length > 0) {
      console.warn('⚠️ Missing CSS classes detected:', missingClasses);
      console.warn('💡 These classes may have been purged by Tailwind');
    } else {
      console.log('✅ All test CSS classes are present');
    }
    
    // DaisyUI menu selector'larını kontrol et
    const menuElement = document.createElement('ul');
    menuElement.className = 'menu';
    const menuItem = document.createElement('li');
    const menuLink = document.createElement('a');
    menuLink.textContent = 'Test';
    menuItem.appendChild(menuLink);
    menuElement.appendChild(menuItem);
    document.body.appendChild(menuElement);
    
    const menuStyles = window.getComputedStyle(menuLink);
    const menuHasStyles = menuStyles.display === 'grid' || 
                         menuStyles.gridAutoFlow === 'column' ||
                         menuStyles.paddingInline !== '0px';
    
    if (!menuHasStyles) {
      console.warn('⚠️ DaisyUI menu selectors may be missing');
      console.warn('💡 Check if .menu :where(...) selectors are present in CSS');
    }
    
    document.body.removeChild(menuElement);
    
    return {
      missingClasses,
      menuStylesPresent: menuHasStyles,
    };
  }
  
  return null;
};

