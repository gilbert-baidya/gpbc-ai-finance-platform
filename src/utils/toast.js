export const successToast = (message) => {
    console.log(`%c[SUCCESS] %c${message}`, 'color: #1F6F54; font-weight: bold', 'color: inherit');
};

export const errorToast = (message) => {
    console.error(`%c[ERROR] %c${message}`, 'color: #4A0E1A; font-weight: bold', 'color: inherit');
};
