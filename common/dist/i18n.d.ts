import i18n from 'i18next';
export declare const resources: {
    readonly en: {
        readonly common: {
            welcome: string;
            error: {
                title: string;
                description: string;
            };
            language: string;
            loading: string;
            buttons: {
                customize: string;
                confirmChanges: string;
                addToShoot: string;
                edit: string;
                delete: string;
                save: string;
                cancel: string;
                back: string;
                close: string;
                next: string;
                previous: string;
                keep: string;
                discard: string;
                confirm: string;
                remove: string;
                add: string;
                explore: string;
            };
            navigation: {
                addStyles: string;
                payment: string;
                uploadPhotos: string;
                generate: string;
            };
            userNav: {
                signOut: string;
                accountSettings: string;
            };
        };
        readonly auth: {
            signin: {
                title: string;
                description: string;
                email: {
                    placeholder: string;
                    button: string;
                    loading: string;
                };
                divider: {
                    text: string;
                };
                google: {
                    button: string;
                };
                apple: {
                    button: string;
                };
                linkedin: {
                    button: string;
                };
                microsoft: {
                    button: string;
                };
                emailInput: {
                    placeholder: string;
                    sendButton: string;
                    sendingButton: string;
                };
                social: {
                    cancelled: {
                        title: string;
                        description: string;
                    };
                    error: {
                        title: string;
                    };
                };
                terms: {
                    text: string;
                    termsLink: string;
                    and: string;
                    privacyLink: string;
                    ageConsent: string;
                };
            };
            verify: {
                title: string;
                description: string;
                resend: {
                    text: string;
                    button: string;
                    buttonLoading: string;
                    success: string;
                    error: {
                        noEmail: string;
                        failed: string;
                    };
                };
            };
            authCodeError: {
                title: string;
                description: string;
                backLink: string;
            };
            errors: {
                invalidReturnUrl: string;
                generic: string;
            };
        };
    };
};
export default i18n;
