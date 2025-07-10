let webContainerInstance = null;

export const getWebContainer = async () => {
    if (typeof window === 'undefined') {
        console.warn('WebContainer is only available in browser environments');
        return null;
    }

    if (webContainerInstance === null) {
        try {
            const { WebContainer } = await import('@webcontainer/api');
            webContainerInstance = await WebContainer.boot();
        } catch (error) {
            console.error('Failed to initialize WebContainer:', error);
            return null;
        }
    }
    return webContainerInstance;
} 