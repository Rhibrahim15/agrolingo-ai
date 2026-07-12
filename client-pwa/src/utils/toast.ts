export const showToast = (msg: string) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: msg }));
  }
};