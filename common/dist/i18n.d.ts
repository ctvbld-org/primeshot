import i18n from 'i18next';
export declare const resources: {
    us: {
        common: {
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
                signIn: string;
            };
            navigation: {
                addStyles: string;
                payment: string;
                uploadPhotos: string;
                generate: string;
                explore: string;
                create: string;
                admin: string;
            };
            userNav: {
                signOut: string;
                accountSettings: string;
            };
            footer: {
                about: string;
                terms: string;
                privacy: string;
                copyright: string;
            };
            duration: {
                year_one: string;
                year_other: string;
                month_one: string;
                month_other: string;
                day_one: string;
                day_other: string;
            };
            aria: {
                favorites: string;
                avatar: string;
                brandLogo: string;
            };
            credits: {
                remaining_one: string;
                remaining_other: string;
            };
            contexts: {
                dialogService: {
                    defaultTitle: string;
                    defaultDescription: string;
                    notReadyWarning: string;
                };
                errors: {
                    missingProvider: {
                        styleSelection: string;
                        dialogService: string;
                        inferenceQueue: string;
                        carousel: string;
                        realtime: string;
                    };
                };
            };
        };
        auth: {
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
                emailInput: {
                    placeholder: string;
                    sendButton: string;
                    sendingButton: string;
                };
                social: {
                    button: string;
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
                otp: {
                    title: string;
                    description: string;
                    verify: string;
                    verifying: string;
                    success: string;
                    error: {
                        invalidCode: string;
                        invalid: string;
                        expired: string;
                        generic: string;
                    };
                };
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
        pricing: {
            buyCredits: {
                title: string;
                description: string;
            };
            upgradePlan: {
                title: string;
                description: string;
            };
            purchase: {
                success: {
                    subscriptionTitle: string;
                    subscriptionTitleNew: string;
                    creditsTitle: string;
                    subscriptionDescriptionWithCredits: string;
                    subscriptionDescriptionWithCreditsNew: string;
                    subscriptionDescription: string;
                    subscriptionDescriptionNew: string;
                    creditsDescription: string;
                    returnToShoot: string;
                    defaultPlan: string;
                };
            };
            subscription: {
                context: {
                    characterLimit: {
                        title: string;
                        description: string;
                    };
                    qualityUpgrade: {
                        title: string;
                        description: string;
                    };
                    creditUpgrade: {
                        title: string;
                        description: string;
                    };
                    general: {
                        title: string;
                        description: string;
                    };
                    default: {
                        title: string;
                        description: string;
                    };
                };
                loading: string;
                empty: {
                    title: string;
                    description: string;
                };
                headers: {
                    chooseYourPlan: string;
                };
                banner: {
                    titleStart: string;
                    titleNumber: string;
                    description: {
                        start: string;
                        lifetime: string;
                        annualDiscount: string;
                        annualWord: string;
                        or: string;
                        monthlyDiscount: string;
                        monthlyWord: string;
                        end: string;
                    };
                    small: string;
                };
                toggle: {
                    monthly: string;
                    yearly: string;
                    aria: string;
                };
                card: {
                    recommended: string;
                    save: string;
                    perMonth: string;
                    billed: string;
                    creditsCount: string;
                    perMonthWord: string;
                    perCredit: string;
                    button: {
                        select: string;
                        current: string;
                        processing: string;
                        disabledTooltip: string;
                    };
                    features: {
                        quality: string;
                        characterIncluded: string;
                        maxCharacters: string;
                        concurrentShoots: string;
                        commercialUse: string;
                    };
                };
                footer: {
                    upgradeNotice: string;
                };
                toasts: {
                    loginRequired: string;
                    selectPlan: string;
                    invalidPlan: string;
                    openingPortal: string;
                    customerPortalFailed: string;
                    upgradePreviewFailed: string;
                    upgraded: string;
                    checkoutFailed: string;
                    invalidCheckout: string;
                };
            };
            credits: {
                dialog: {
                    headerSub: {
                        lowBalance: string;
                        creativity: string;
                    };
                    headerTitle: {
                        lowBalance: string;
                        fun: string;
                    };
                };
                card: {
                    images: string;
                    characters: string;
                    footnote: string;
                    button: {
                        buy: string;
                        processing: string;
                    };
                    validity: string;
                    oneTime: string;
                    perCredit: string;
                    perCreditWord: string;
                };
                toasts: {
                    loginRequired: string;
                    invalidPackConfig: string;
                    createCheckoutFailed: string;
                    purchaseFailed: string;
                };
            };
            comparisonTable: {
                categories: {
                    credits: string;
                    image: string;
                    characters: string;
                    generation: string;
                    support: string;
                };
                features: {
                    creditsPerMonth: string;
                    pricePerCredit: string;
                    resolution: string;
                    takesPerShoot: string;
                    portraitAspectRatio: string;
                    squareAspectRatio: string;
                    landscapeAspectRatio: string;
                    included: string;
                    storage: string;
                    concurrentShoots: string;
                    commercialUse: string;
                    priorityFeatures: string;
                    betaAccess: string;
                    emailSupport: string;
                    chatSupport: string;
                    dedicatedSupport: string;
                };
                values: {
                    upTo: string;
                };
            };
        };
        styles: {
            titles: {
                styleLabel: string;
                photoStyle: string;
                sceneLabel: string;
                wardrobeLabel: string;
                characterLabel: string;
                settingsLabel: string;
            };
            buttons: {
                viewExamples: string;
            };
            messages: {
                noPreviewImages: string;
            };
            shoot: {
                subtitle: string;
            };
            character: {
                trainingQueued: string;
                trainingPending: string;
                trainingInitializing: string;
                remaining: string;
                photos: string;
                trainingFailedTitle: string;
                trainingFailedDesc: string;
            };
            qualities: {
                basic: string;
                medium: string;
                high: string;
            };
            labels: {
                credits: string;
                includedInPlan: string;
                limitReached: string;
                upgradePlanAddMore: string;
                upgradeOrBuyCredits: string;
                buyCredits: string;
                newStylesDropWeekly: string;
            };
            settings: {
                numberOfTakes: string;
                quality: string;
                aspectRatio: string;
            };
            status: {
                badge: {
                    pending: string;
                    queued: string;
                    initializing: string;
                    starting: string;
                    running: string;
                    generating: string;
                    completed: string;
                    failed: string;
                    connecting: string;
                };
                tooltip: {
                    pending: string;
                    queued: string;
                    queueReasons: {
                        character_not_ready: string;
                        concurrent_limit: string;
                        provider_temporary_issue: string;
                    };
                };
            };
        };
        generate: {
            buttons: {
                generate: string;
                create: string;
                done: string;
                cancel: string;
                confirm: string;
            };
            labels: {
                woman: string;
                man: string;
                scene: string;
                wardrobe: string;
                creditsSuffix: string;
                requiresActiveSubscription: string;
                calculating: string;
            };
            aria: {
                selectStyle: string;
                selectScene: string;
                selectWardrobe: string;
                selectCharacter: string;
                openSettings: string;
                trainingProgress: string;
                characterActions: string;
                closeOverlay: string;
                carouselNavigation: string;
                previous: string;
                next: string;
                search: string;
            };
            placeholders: {
                find: string;
            };
            admin: {
                title: string;
                enableNodeOverrides: string;
                overridesJson: string;
                enablePromptOverride: string;
                prompt: string;
                characterMetadata: string;
            };
            errors: {
                failedToStartGeneration: string;
                selectCharacterToGenerate: string;
            };
        };
        inference: {
            common: {
                pleaseTryAgain: string;
                cancel: string;
            };
            time: {
                justNow: string;
                minutesAgo: string;
                hoursAgo: string;
                daysAgo: string;
            };
            gallery: {
                error: string;
                retry: string;
                loadingMore: string;
                endOfList: string;
                howItWorksAria: string;
                steps: {
                    choose: {
                        title: string;
                        desc: string;
                    };
                    character: {
                        title: string;
                        desc: string;
                    };
                    generate: {
                        title: string;
                        desc: string;
                    };
                };
            };
            viewer: {
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                    cancel: string;
                };
                closeAria: string;
                carousel: {
                    aria: string;
                    prevAria: string;
                    nextAria: string;
                };
                overlay: {
                    displayOriginal: string;
                    displayOriginalAria: string;
                    originalUnavailableTitle: string;
                    originalUnavailableDesc: string;
                };
                viewOriginal: {
                    label: string;
                    viewing: string;
                    aria: string;
                    viewingAria: string;
                };
                title: string;
                imageIndex: string;
                favourite: {
                    ariaButton: string;
                    add: string;
                    remove: string;
                    updateErrorTitle: string;
                };
                metadata: {
                    labels: {
                        aspectRatio: string;
                        quality: string;
                        model: string;
                        character: string;
                    };
                    aspectLabels: {
                        square: string;
                        landscape: string;
                        portrait: string;
                    };
                };
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                alt: {
                    generated: string;
                    thumbnail: string;
                };
            };
            group: {
                status: {
                    failed: string;
                };
                error: {
                    generic: string;
                    timeout: string;
                    serverBusy: string;
                    memory: string;
                    connection: string;
                    imageGeneration: string;
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
                deleteFailedTitle: string;
                rerun: {
                    cannot: string;
                    missingInfo: string;
                    failed: string;
                };
                header: {
                    shootTitle: string;
                };
                tooltips: {
                    deleteShoot: string;
                    rerunShoot: string;
                };
                aria: {
                    thumbnailsPreview: string;
                    viewAllImages: string;
                };
                alt: {
                    preview: string;
                };
                buttons: {
                    viewAll: string;
                };
            };
            thumbnail: {
                alt: {
                    generatingPreview: string;
                    generated: string;
                };
                favourite: {
                    add: string;
                    remove: string;
                };
                loadingTitle: string;
                loadingDesc: string;
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
            };
        };
        character: {
            nameLabel: string;
            creditsRequired: string;
            training: string;
            trainingInitializing: string;
            trainingInitializingInfo: string;
            trainingQueued: string;
            trainingQueuedInfo: string;
            trainingWarmingUp: string;
            trainingWarmingUpInfo: string;
            trainingPending: string;
            trainingPendingInfo: string;
            trainingRunning: string;
            trainingRunningNoCountdown: string;
            trainingRunningInfo: string;
            returnToApp: string;
            trainingError: string;
            trainingFailed: string;
            trainingFailedDescription: string;
            confirmClose: {
                title: string;
                description: string;
                progressMessages: {
                    upload: string;
                    profile: string;
                    name: string;
                };
                buttons: {
                    cancel: string;
                    confirm: string;
                };
            };
            errors: {
                trainingRetryFailed: string;
                retryError: string;
            };
            upload: {
                uploadingFiles: string;
                uploadingInfo: string;
            };
            dialogTitles: {
                onboardingIntro: string;
                onboardingGuidelines: string;
                onboardingConfirmation: string;
                upload: string;
                name: string;
                uploading: string;
                training: string;
            };
            dialogDescription: {
                upload: string;
                name: string;
                training: string;
                default: string;
            };
            beforeUnloadWarning: string;
            onboarding: {
                intro: {
                    title: string;
                    description1: string;
                    description2: string;
                    privacy: string;
                    buttonGetStarted: string;
                    buttonSkip: string;
                };
                confirmation: {
                    title: string;
                    paragraph1: string;
                    paragraph2: string;
                    buttonStart: string;
                };
                guidelines: {
                    naturalLight: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    angles: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    expressions: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    variety: {
                        title: string;
                        description: string;
                        description2: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                };
                buttons: {
                    next: string;
                };
                floatingAlt: string;
            };
            uploadStep: {
                petMode: string;
                bodyShotRequirementsNotMet: string;
            };
            nameStep: {
                noPreview: string;
                create: string;
                altPreview: string;
            };
            countdown: {
                fallback: string;
            };
            requirements: {
                header: {
                    title: string;
                    description: string;
                    secureNote: string;
                };
                sections: {
                    uploadTips: string;
                    dosDonts: string;
                };
                tips: {
                    blurredBackground: string;
                    naturalLight: string;
                    photos: string;
                    expression: string;
                    avoid: string;
                    clothing: string;
                    quantity: string;
                };
                dodonts: {
                    eyes: string;
                    lighting: string;
                    frame: string;
                    face: string;
                };
                altText: {
                    goodExample: string;
                    badExample: string;
                };
            };
            quality: {
                issues: {
                    image: {
                        lowResolution: string;
                        suboptimalResolution: string;
                        suboptimalResolutionLow: string;
                        tooDark: string;
                        tooBright: string;
                    };
                    face: {
                        none: string;
                        multiple: string;
                        lowScore: string;
                        positionNotOptimal: string;
                        detectSkipped: string;
                        angleExtreme: string;
                        sunglasses: string;
                        "sunglasses.critical": string;
                        eyesClosed: string;
                        tooSmall: string;
                        tooSmallToDetect: string;
                        tooLarge: string;
                        sizeNotOptimal: string;
                    };
                    contrast: {
                        separation: {
                            nearlyIdentical: string;
                            tooSimilar: string;
                            couldBeMoreDistinct: string;
                        };
                        poorOrFlat: string;
                        suboptimal: string;
                    };
                    sharpness: {
                        tooBlurry: string;
                        pixelated: string;
                        suboptimal: string;
                    };
                    background: {
                        notBlurred: string;
                    };
                    brightness: {
                        suboptimal: string;
                    };
                    resolution: {
                        low: string;
                    };
                    upload: {
                        none: string;
                    };
                    body: {
                        minRequired: string;
                        tooMany: string;
                    };
                    score: {
                        tooLow: string;
                    };
                    eyes: {
                        maybeNotVisible: string;
                    };
                    reject: {
                        genericHint: string;
                    };
                };
            };
            uploader: {
                dragDropMessage: string;
                dragDropMoreMessage_one: string;
                dragDropMoreMessage_other: string;
                browse: string;
                supportedFormats: string;
                dropMessage: string;
                maxImagesReached: string;
            };
            status: {
                analyzing: string;
                checkingQuality: string;
            };
        };
        about: {
            mission: {
                line1: string;
            };
            paragraphs: string[];
            labels: {
                cofounders: string;
            };
        };
        legal: {
            common: {
                effectiveDate: string;
                endMarker: string;
                contact: string;
                email: string;
            };
            terms: {
                title: string;
                intro: string;
                sections: {
                    definitions: {
                        title: string;
                        items: {
                            service: string;
                            user: string;
                            userContent: string;
                            aiGenerated: string;
                            credits: string;
                        };
                    };
                    eligibility: {
                        title: string;
                        content: string;
                    };
                    userAccounts: {
                        title: string;
                        items: string[];
                    };
                    payments: {
                        title: string;
                        content: string;
                        refundsTitle: string;
                        refunds: string;
                        priceChangesTitle: string;
                        priceChanges: string;
                    };
                    ownership: {
                        title: string;
                        content: string;
                    };
                    prohibitedContent: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    aiGenerated: {
                        title: string;
                        content: string;
                    };
                    privacy: {
                        title: string;
                        content: string;
                    };
                    ip: {
                        title: string;
                        content: string;
                    };
                    liability: {
                        title: string;
                        content: string;
                    };
                    indemnity: {
                        title: string;
                        content: string;
                    };
                    termination: {
                        title: string;
                        content: string;
                    };
                    law: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    misc: {
                        title: string;
                        items: {
                            severability: string;
                            entireAgreement: string;
                            contact: string;
                        };
                    };
                };
            };
            privacy: {
                title: string;
                intro: string;
                sections: {
                    collect: {
                        title: string;
                        items: {
                            account: string;
                            userContent: string;
                            device: string;
                        };
                        note: string;
                    };
                    use: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    thirdParty: {
                        title: string;
                        items: {
                            aws: string;
                            stripe: string;
                        };
                        note: string;
                    };
                    cookies: {
                        title: string;
                        content: string;
                    };
                    retention: {
                        title: string;
                        content: string;
                    };
                    security: {
                        title: string;
                        intro: string;
                        items: string[];
                    };
                    rights: {
                        title: string;
                        intro: string;
                        items: string[];
                        contact: string;
                    };
                    children: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    contact: {
                        title: string;
                        content: string;
                    };
                };
            };
        };
        upload: {
            title: string;
            description: string;
            requirements: {
                title: string;
                description: string;
            };
            buttons: {
                upload: string;
                continue: string;
                retry: string;
            };
            errors: {
                invalidFile: string;
                fileTooLarge: string;
                uploadFailed: string;
                invalidFileType: string;
                fileSizeExceeded: string;
                duplicateFile: string;
                uploadFailedCount_one: string;
                uploadFailedCount_other: string;
                analysisTimeout: string;
                analysisTimeoutDescription: string;
            };
            progress: {
                uploading: string;
                processing: string;
                complete: string;
            };
            quality: {
                rejected: {
                    title: string;
                };
            };
        };
        homepage: {
            hero: {
                headline: string;
                tagline: string;
                subtitle: string;
            };
            story: {
                paragraph1: string;
                paragraph2: string;
                callToAction: string;
            };
            aria: {
                photoMetadata: string;
            };
            waitlist: {
                placeholder: string;
                ariaLabel: string;
                submitLabel: string;
                submittingLabel: string;
                validation: {
                    invalidEmail: string;
                };
                messages: {
                    alreadyOnWaitlist: string;
                    success: string;
                    defaultError: string;
                };
            };
        };
        account: {
            dialog: {
                title: string;
                selectSection: string;
            };
            navigation: {
                profile: string;
                subscription: string;
                settings: string;
                support: string;
            };
            buttons: {
                cancel: string;
                save: string;
                saving: string;
                signOut: string;
                subscribe: string;
                opening: string;
                manage: string;
                renew: string;
                buyCredits: string;
                deleteAccount: string;
            };
            profile: {
                title: string;
                firstName: string;
                lastName: string;
                email: string;
            };
            subscription: {
                title: string;
                loading: string;
                noPlan: string;
                planSuffix: string;
                cancelled: string;
                expires: string;
                renews: string;
                creditBalance: string;
                resets: string;
            };
            settings: {
                title: string;
                language: string;
                deleteAccount: {
                    title: string;
                    description: string;
                };
            };
            support: {
                title: string;
                description: string;
                faq: string;
                faqDescription: string;
                helpCenter: string;
                dmUs: string;
                emailUs: string;
            };
            errors: {
                failedToSave: string;
            };
            accessibility: {
                avatar: string;
                plan: string;
            };
        };
    };
    gb: {
        common: {
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
                signIn: string;
            };
            navigation: {
                addStyles: string;
                payment: string;
                uploadPhotos: string;
                generate: string;
                explore: string;
                create: string;
                admin: string;
            };
            userNav: {
                signOut: string;
                accountSettings: string;
            };
            footer: {
                about: string;
                terms: string;
                privacy: string;
                copyright: string;
            };
            duration: {
                year_one: string;
                year_other: string;
                month_one: string;
                month_other: string;
                day_one: string;
                day_other: string;
            };
            aria: {
                favourites: string;
                avatar: string;
                brandLogo: string;
            };
            credits: {
                remaining_one: string;
                remaining_other: string;
            };
            contexts: {
                dialogService: {
                    defaultTitle: string;
                    defaultDescription: string;
                    notReadyWarning: string;
                };
                errors: {
                    missingProvider: {
                        styleSelection: string;
                        dialogService: string;
                        inferenceQueue: string;
                        carousel: string;
                        realtime: string;
                    };
                };
            };
        };
        auth: {
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
                emailInput: {
                    placeholder: string;
                    sendButton: string;
                    sendingButton: string;
                };
                social: {
                    button: string;
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
                otp: {
                    title: string;
                    description: string;
                    verify: string;
                    verifying: string;
                    success: string;
                    error: {
                        invalidCode: string;
                        invalid: string;
                        expired: string;
                        generic: string;
                    };
                };
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
        pricing: {
            buyCredits: {
                title: string;
                description: string;
            };
            upgradePlan: {
                title: string;
                description: string;
            };
            purchase: {
                success: {
                    subscriptionTitle: string;
                    subscriptionTitleNew: string;
                    creditsTitle: string;
                    subscriptionDescriptionWithCredits: string;
                    subscriptionDescriptionWithCreditsNew: string;
                    subscriptionDescription: string;
                    subscriptionDescriptionNew: string;
                    creditsDescription: string;
                    returnToShoot: string;
                    defaultPlan: string;
                };
            };
            subscription: {
                context: {
                    characterLimit: {
                        title: string;
                        description: string;
                    };
                    qualityUpgrade: {
                        title: string;
                        description: string;
                    };
                    creditUpgrade: {
                        title: string;
                        description: string;
                    };
                    general: {
                        title: string;
                        description: string;
                    };
                    default: {
                        title: string;
                        description: string;
                    };
                };
                loading: string;
                empty: {
                    title: string;
                    description: string;
                };
                headers: {
                    chooseYourPlan: string;
                };
                banner: {
                    titleStart: string;
                    titleNumber: string;
                    description: {
                        start: string;
                        lifetime: string;
                        annualDiscount: string;
                        annualWord: string;
                        or: string;
                        monthlyDiscount: string;
                        monthlyWord: string;
                        end: string;
                    };
                    small: string;
                };
                toggle: {
                    monthly: string;
                    yearly: string;
                    aria: string;
                };
                card: {
                    recommended: string;
                    save: string;
                    perMonth: string;
                    billed: string;
                    creditsCount: string;
                    perMonthWord: string;
                    perCredit: string;
                    button: {
                        select: string;
                        current: string;
                        processing: string;
                        disabledTooltip: string;
                    };
                    features: {
                        quality: string;
                        characterIncluded: string;
                        maxCharacters: string;
                        concurrentShoots: string;
                        commercialUse: string;
                    };
                };
                footer: {
                    upgradeNotice: string;
                };
                toasts: {
                    loginRequired: string;
                    selectPlan: string;
                    invalidPlan: string;
                    openingPortal: string;
                    customerPortalFailed: string;
                    upgradePreviewFailed: string;
                    upgraded: string;
                    checkoutFailed: string;
                    invalidCheckout: string;
                };
            };
            credits: {
                dialog: {
                    headerSub: {
                        lowBalance: string;
                        creativity: string;
                    };
                    headerTitle: {
                        lowBalance: string;
                        fun: string;
                    };
                };
                card: {
                    images: string;
                    characters: string;
                    footnote: string;
                    button: {
                        buy: string;
                        processing: string;
                    };
                    validity: string;
                    oneTime: string;
                    perCredit: string;
                    perCreditWord: string;
                };
                toasts: {
                    loginRequired: string;
                    invalidPackConfig: string;
                    createCheckoutFailed: string;
                    purchaseFailed: string;
                };
            };
            comparisonTable: {
                categories: {
                    credits: string;
                    image: string;
                    characters: string;
                    generation: string;
                    support: string;
                };
                features: {
                    creditsPerMonth: string;
                    pricePerCredit: string;
                    resolution: string;
                    takesPerShoot: string;
                    portraitAspectRatio: string;
                    squareAspectRatio: string;
                    landscapeAspectRatio: string;
                    included: string;
                    storage: string;
                    concurrentShoots: string;
                    commercialUse: string;
                    priorityFeatures: string;
                    betaAccess: string;
                    emailSupport: string;
                    chatSupport: string;
                    dedicatedSupport: string;
                };
                values: {
                    upTo: string;
                };
            };
        };
        styles: {
            titles: {
                styleLabel: string;
                photoStyle: string;
                sceneLabel: string;
                wardrobeLabel: string;
                characterLabel: string;
                settingsLabel: string;
            };
            buttons: {
                viewExamples: string;
            };
            messages: {
                noPreviewImages: string;
            };
            shoot: {
                subtitle: string;
            };
            character: {
                trainingQueued: string;
                trainingPending: string;
                trainingInitializing: string;
                remaining: string;
                photos: string;
                trainingFailedTitle: string;
                trainingFailedDesc: string;
            };
            qualities: {
                basic: string;
                medium: string;
                high: string;
            };
            labels: {
                credits: string;
                includedInPlan: string;
                limitReached: string;
                upgradePlanAddMore: string;
                upgradeOrBuyCredits: string;
                buyCredits: string;
                newStylesDropWeekly: string;
            };
            settings: {
                numberOfTakes: string;
                quality: string;
                aspectRatio: string;
            };
            status: {
                badge: {
                    pending: string;
                    queued: string;
                    initializing: string;
                    starting: string;
                    running: string;
                    generating: string;
                    completed: string;
                    failed: string;
                    connecting: string;
                };
                tooltip: {
                    pending: string;
                    queued: string;
                    queueReasons: {
                        character_not_ready: string;
                        concurrent_limit: string;
                        provider_temporary_issue: string;
                    };
                };
            };
        };
        generate: {
            buttons: {
                generate: string;
                create: string;
                done: string;
                cancel: string;
                confirm: string;
            };
            labels: {
                woman: string;
                man: string;
                scene: string;
                wardrobe: string;
                creditsSuffix: string;
                requiresActiveSubscription: string;
                calculating: string;
            };
            aria: {
                selectStyle: string;
                selectScene: string;
                selectWardrobe: string;
                selectCharacter: string;
                openSettings: string;
                trainingProgress: string;
                characterActions: string;
                closeOverlay: string;
                carouselNavigation: string;
                previous: string;
                next: string;
                search: string;
            };
            placeholders: {
                find: string;
            };
            admin: {
                title: string;
                enableNodeOverrides: string;
                overridesJson: string;
                enablePromptOverride: string;
                prompt: string;
                characterMetadata: string;
            };
            errors: {
                failedToStartGeneration: string;
                selectCharacterToGenerate: string;
            };
        };
        inference: {
            common: {
                pleaseTryAgain: string;
                cancel: string;
            };
            time: {
                justNow: string;
                minutesAgo: string;
                hoursAgo: string;
                daysAgo: string;
            };
            gallery: {
                error: string;
                retry: string;
                loadingMore: string;
                endOfList: string;
                howItWorksAria: string;
                steps: {
                    choose: {
                        title: string;
                        desc: string;
                    };
                    character: {
                        title: string;
                        desc: string;
                    };
                    generate: {
                        title: string;
                        desc: string;
                    };
                };
            };
            viewer: {
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                    cancel: string;
                };
                closeAria: string;
                carousel: {
                    aria: string;
                    prevAria: string;
                    nextAria: string;
                };
                overlay: {
                    displayOriginal: string;
                    displayOriginalAria: string;
                    originalUnavailableTitle: string;
                    originalUnavailableDesc: string;
                };
                viewOriginal: {
                    label: string;
                    viewing: string;
                    aria: string;
                    viewingAria: string;
                };
                title: string;
                imageIndex: string;
                favourite: {
                    ariaButton: string;
                    add: string;
                    remove: string;
                    updateErrorTitle: string;
                };
                metadata: {
                    labels: {
                        aspectRatio: string;
                        quality: string;
                        model: string;
                        character: string;
                    };
                    aspectLabels: {
                        square: string;
                        landscape: string;
                        portrait: string;
                    };
                };
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                alt: {
                    generated: string;
                    thumbnail: string;
                };
            };
            group: {
                status: {
                    failed: string;
                };
                error: {
                    generic: string;
                    timeout: string;
                    serverBusy: string;
                    memory: string;
                    connection: string;
                    imageGeneration: string;
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
                deleteFailedTitle: string;
                rerun: {
                    cannot: string;
                    missingInfo: string;
                    failed: string;
                };
                header: {
                    shootTitle: string;
                };
                tooltips: {
                    deleteShoot: string;
                    rerunShoot: string;
                };
                aria: {
                    thumbnailsPreview: string;
                    viewAllImages: string;
                };
                alt: {
                    preview: string;
                };
                buttons: {
                    viewAll: string;
                };
            };
            thumbnail: {
                alt: {
                    generatingPreview: string;
                    generated: string;
                };
                favourite: {
                    add: string;
                    remove: string;
                };
                loadingTitle: string;
                loadingDesc: string;
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
            };
        };
        character: {
            nameLabel: string;
            creditsRequired: string;
            training: string;
            trainingInitializing: string;
            trainingInitializingInfo: string;
            trainingQueued: string;
            trainingQueuedInfo: string;
            trainingWarmingUp: string;
            trainingWarmingUpInfo: string;
            trainingPending: string;
            trainingPendingInfo: string;
            trainingRunning: string;
            trainingRunningNoCountdown: string;
            trainingRunningInfo: string;
            returnToApp: string;
            trainingError: string;
            trainingFailed: string;
            trainingFailedDescription: string;
            confirmClose: {
                title: string;
                description: string;
                progressMessages: {
                    upload: string;
                    profile: string;
                    name: string;
                };
                buttons: {
                    cancel: string;
                    confirm: string;
                };
            };
            errors: {
                trainingRetryFailed: string;
                retryError: string;
            };
            upload: {
                uploadingFiles: string;
                uploadingInfo: string;
            };
            dialogTitles: {
                onboardingIntro: string;
                onboardingGuidelines: string;
                onboardingConfirmation: string;
                upload: string;
                name: string;
                uploading: string;
                training: string;
            };
            dialogDescription: {
                upload: string;
                name: string;
                training: string;
                default: string;
            };
            beforeUnloadWarning: string;
            onboarding: {
                intro: {
                    title: string;
                    description1: string;
                    description2: string;
                    privacy: string;
                    buttonGetStarted: string;
                    buttonSkip: string;
                };
                confirmation: {
                    title: string;
                    paragraph1: string;
                    paragraph2: string;
                    buttonStart: string;
                };
                guidelines: {
                    naturalLight: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    angles: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    expressions: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    variety: {
                        title: string;
                        description: string;
                        description2: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                };
                buttons: {
                    next: string;
                };
                floatingAlt: string;
            };
            uploadStep: {
                petMode: string;
                bodyShotRequirementsNotMet: string;
            };
            nameStep: {
                noPreview: string;
                create: string;
                altPreview: string;
            };
            countdown: {
                fallback: string;
            };
            requirements: {
                header: {
                    title: string;
                    description: string;
                    secureNote: string;
                };
                sections: {
                    uploadTips: string;
                    dosDonts: string;
                };
                tips: {
                    blurredBackground: string;
                    naturalLight: string;
                    photos: string;
                    expression: string;
                    avoid: string;
                    clothing: string;
                    quantity: string;
                };
                dodonts: {
                    eyes: string;
                    lighting: string;
                    frame: string;
                    face: string;
                };
                altText: {
                    goodExample: string;
                    badExample: string;
                };
            };
            quality: {
                issues: {
                    image: {
                        lowResolution: string;
                        suboptimalResolution: string;
                        suboptimalResolutionLow: string;
                        tooDark: string;
                        tooBright: string;
                    };
                    face: {
                        none: string;
                        multiple: string;
                        positionNotOptimal: string;
                        detectSkipped: string;
                        angleExtreme: string;
                        sunglasses: string;
                        "sunglasses.critical": string;
                        eyesClosed: string;
                        tooSmall: string;
                        tooSmallToDetect: string;
                        tooLarge: string;
                        sizeNotOptimal: string;
                    };
                    contrast: {
                        separation: {
                            nearlyIdentical: string;
                            tooSimilar: string;
                            couldBeMoreDistinct: string;
                        };
                        poorOrFlat: string;
                    };
                    sharpness: {
                        tooBlurry: string;
                        pixelated: string;
                        suboptimal: string;
                    };
                    background: {
                        notBlurred: string;
                    };
                    upload: {
                        none: string;
                    };
                    body: {
                        minRequired: string;
                        tooMany: string;
                    };
                    score: {
                        tooLow: string;
                    };
                    eyes: {
                        maybeNotVisible: string;
                    };
                    reject: {
                        genericHint: string;
                    };
                };
            };
            uploader: {
                dragDropMessage: string;
                dragDropMoreMessage_one: string;
                dragDropMoreMessage_other: string;
                browse: string;
                supportedFormats: string;
                dropMessage: string;
                maxImagesReached: string;
            };
            status: {
                analyzing: string;
                checkingQuality: string;
            };
        };
        about: {
            mission: {
                line1: string;
            };
            paragraphs: string[];
            labels: {
                cofounders: string;
            };
        };
        legal: {
            common: {
                effectiveDate: string;
                endMarker: string;
                contact: string;
                email: string;
            };
            terms: {
                title: string;
                intro: string;
                sections: {
                    definitions: {
                        title: string;
                        items: {
                            service: string;
                            user: string;
                            userContent: string;
                            aiGenerated: string;
                            credits: string;
                        };
                    };
                    eligibility: {
                        title: string;
                        content: string;
                    };
                    userAccounts: {
                        title: string;
                        items: string[];
                    };
                    payments: {
                        title: string;
                        content: string;
                        refundsTitle: string;
                        refunds: string;
                        priceChangesTitle: string;
                        priceChanges: string;
                    };
                    ownership: {
                        title: string;
                        content: string;
                    };
                    prohibitedContent: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    aiGenerated: {
                        title: string;
                        content: string;
                    };
                    privacy: {
                        title: string;
                        content: string;
                    };
                    ip: {
                        title: string;
                        content: string;
                    };
                    liability: {
                        title: string;
                        content: string;
                    };
                    indemnity: {
                        title: string;
                        content: string;
                    };
                    termination: {
                        title: string;
                        content: string;
                    };
                    law: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    misc: {
                        title: string;
                        items: {
                            severability: string;
                            entireAgreement: string;
                            contact: string;
                        };
                    };
                };
            };
            privacy: {
                title: string;
                intro: string;
                sections: {
                    collect: {
                        title: string;
                        items: {
                            account: string;
                            userContent: string;
                            device: string;
                        };
                        note: string;
                    };
                    use: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    thirdParty: {
                        title: string;
                        items: {
                            aws: string;
                            stripe: string;
                        };
                        note: string;
                    };
                    cookies: {
                        title: string;
                        content: string;
                    };
                    retention: {
                        title: string;
                        content: string;
                    };
                    security: {
                        title: string;
                        intro: string;
                        items: string[];
                    };
                    rights: {
                        title: string;
                        intro: string;
                        items: string[];
                        contact: string;
                    };
                    children: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    contact: {
                        title: string;
                        content: string;
                    };
                };
            };
        };
        upload: {
            title: string;
            description: string;
            requirements: {
                title: string;
                description: string;
            };
            buttons: {
                upload: string;
                continue: string;
                retry: string;
            };
            errors: {
                invalidFile: string;
                fileTooLarge: string;
                uploadFailed: string;
                invalidFileType: string;
                fileSizeExceeded: string;
                duplicateFile: string;
                uploadFailedCount_one: string;
                uploadFailedCount_other: string;
            };
            progress: {
                uploading: string;
                processing: string;
                complete: string;
            };
            quality: {
                rejected: {
                    title: string;
                };
            };
        };
        homepage: {
            hero: {
                headline: string;
                tagline: string;
                subtitle: string;
            };
            story: {
                paragraph1: string;
                paragraph2: string;
                callToAction: string;
            };
            aria: {
                photoMetadata: string;
            };
            waitlist: {
                placeholder: string;
                ariaLabel: string;
                submitLabel: string;
                submittingLabel: string;
                validation: {
                    invalidEmail: string;
                };
                messages: {
                    alreadyOnWaitlist: string;
                    success: string;
                    defaultError: string;
                };
            };
        };
        account: {
            dialog: {
                title: string;
                selectSection: string;
            };
            navigation: {
                profile: string;
                subscription: string;
                settings: string;
                support: string;
            };
            buttons: {
                cancel: string;
                save: string;
                saving: string;
                signOut: string;
                subscribe: string;
                opening: string;
                manage: string;
                renew: string;
                buyCredits: string;
                deleteAccount: string;
            };
            profile: {
                title: string;
                firstName: string;
                lastName: string;
                email: string;
            };
            subscription: {
                title: string;
                loading: string;
                noPlan: string;
                planSuffix: string;
                cancelled: string;
                expires: string;
                renews: string;
                creditBalance: string;
                resets: string;
            };
            settings: {
                title: string;
                language: string;
                deleteAccount: {
                    title: string;
                    description: string;
                };
            };
            support: {
                title: string;
                description: string;
                faq: string;
                faqDescription: string;
                helpCenter: string;
                dmUs: string;
                emailUs: string;
            };
            errors: {
                failedToSave: string;
            };
            accessibility: {
                avatar: string;
                plan: string;
            };
        };
    };
    fr: {
        common: {
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
                signIn: string;
            };
            navigation: {
                addStyles: string;
                payment: string;
                uploadPhotos: string;
                generate: string;
                explore: string;
                create: string;
                admin: string;
            };
            userNav: {
                signOut: string;
                accountSettings: string;
            };
            footer: {
                about: string;
                terms: string;
                privacy: string;
                copyright: string;
            };
            duration: {
                year_one: string;
                year_other: string;
                month_one: string;
                month_other: string;
                day_one: string;
                day_other: string;
            };
            aria: {
                favourites: string;
                avatar: string;
                brandLogo: string;
            };
            credits: {
                remaining_one: string;
                remaining_other: string;
            };
            contexts: {
                dialogService: {
                    defaultTitle: string;
                    defaultDescription: string;
                    notReadyWarning: string;
                };
                errors: {
                    missingProvider: {
                        styleSelection: string;
                        dialogService: string;
                        inferenceQueue: string;
                        carousel: string;
                        realtime: string;
                    };
                };
            };
        };
        auth: {
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
                emailInput: {
                    placeholder: string;
                    sendButton: string;
                    sendingButton: string;
                };
                social: {
                    button: string;
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
                otp: {
                    title: string;
                    description: string;
                    verify: string;
                    verifying: string;
                    success: string;
                    error: {
                        invalidCode: string;
                        invalid: string;
                        expired: string;
                        generic: string;
                    };
                };
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
        pricing: {
            buyCredits: {
                title: string;
                description: string;
            };
            upgradePlan: {
                title: string;
                description: string;
            };
            purchase: {
                success: {
                    subscriptionTitle: string;
                    subscriptionTitleNew: string;
                    creditsTitle: string;
                    subscriptionDescriptionWithCredits: string;
                    subscriptionDescriptionWithCreditsNew: string;
                    subscriptionDescription: string;
                    subscriptionDescriptionNew: string;
                    creditsDescription: string;
                    returnToShoot: string;
                    defaultPlan: string;
                };
            };
            subscription: {
                context: {
                    characterLimit: {
                        title: string;
                        description: string;
                    };
                    qualityUpgrade: {
                        title: string;
                        description: string;
                    };
                    creditUpgrade: {
                        title: string;
                        description: string;
                    };
                    general: {
                        title: string;
                        description: string;
                    };
                    default: {
                        title: string;
                        description: string;
                    };
                };
                loading: string;
                empty: {
                    title: string;
                    description: string;
                };
                headers: {
                    chooseYourPlan: string;
                };
                banner: {
                    titleStart: string;
                    titleNumber: string;
                    description: {
                        start: string;
                        lifetime: string;
                        annualDiscount: string;
                        annualWord: string;
                        or: string;
                        monthlyDiscount: string;
                        monthlyWord: string;
                        end: string;
                    };
                    small: string;
                };
                toggle: {
                    monthly: string;
                    yearly: string;
                    aria: string;
                };
                card: {
                    recommended: string;
                    save: string;
                    perMonth: string;
                    billed: string;
                    creditsCount: string;
                    perMonthWord: string;
                    perCredit: string;
                    button: {
                        select: string;
                        current: string;
                        processing: string;
                        disabledTooltip: string;
                    };
                    features: {
                        quality: string;
                        characterIncluded: string;
                        maxCharacters: string;
                        concurrentShoots: string;
                        commercialUse: string;
                    };
                };
                footer: {
                    upgradeNotice: string;
                };
                toasts: {
                    loginRequired: string;
                    selectPlan: string;
                    invalidPlan: string;
                    openingPortal: string;
                    customerPortalFailed: string;
                    upgradePreviewFailed: string;
                    upgraded: string;
                    checkoutFailed: string;
                    invalidCheckout: string;
                };
            };
            credits: {
                dialog: {
                    headerSub: {
                        lowBalance: string;
                        creativity: string;
                    };
                    headerTitle: {
                        lowBalance: string;
                        fun: string;
                    };
                };
                card: {
                    images: string;
                    characters: string;
                    footnote: string;
                    button: {
                        buy: string;
                        processing: string;
                    };
                    validity: string;
                    oneTime: string;
                    perCredit: string;
                    perCreditWord: string;
                };
                toasts: {
                    loginRequired: string;
                    invalidPackConfig: string;
                    createCheckoutFailed: string;
                    purchaseFailed: string;
                };
            };
            comparisonTable: {
                categories: {
                    credits: string;
                    image: string;
                    characters: string;
                    generation: string;
                    support: string;
                };
                features: {
                    creditsPerMonth: string;
                    pricePerCredit: string;
                    resolution: string;
                    takesPerShoot: string;
                    portraitAspectRatio: string;
                    squareAspectRatio: string;
                    landscapeAspectRatio: string;
                    included: string;
                    storage: string;
                    concurrentShoots: string;
                    commercialUse: string;
                    priorityFeatures: string;
                    betaAccess: string;
                    emailSupport: string;
                    chatSupport: string;
                    dedicatedSupport: string;
                };
                values: {
                    upTo: string;
                };
            };
        };
        styles: {
            titles: {
                styleLabel: string;
                photoStyle: string;
                sceneLabel: string;
                wardrobeLabel: string;
                characterLabel: string;
                settingsLabel: string;
            };
            shoot: {
                subtitle: string;
            };
            character: {
                trainingQueued: string;
                trainingPending: string;
                trainingInitializing: string;
                remaining: string;
                photos: string;
                trainingFailedTitle: string;
                trainingFailedDesc: string;
            };
            qualities: {
                basic: string;
                medium: string;
                high: string;
            };
            labels: {
                credits: string;
                includedInPlan: string;
                limitReached: string;
                upgradePlanAddMore: string;
                upgradeOrBuyCredits: string;
                buyCredits: string;
                newStylesDropWeekly: string;
            };
            settings: {
                numberOfTakes: string;
                quality: string;
                aspectRatio: string;
            };
            status: {
                badge: {
                    pending: string;
                    queued: string;
                    initializing: string;
                    starting: string;
                    running: string;
                    generating: string;
                    completed: string;
                    failed: string;
                    connecting: string;
                };
                tooltip: {
                    pending: string;
                    queued: string;
                    queueReasons: {
                        character_not_ready: string;
                        concurrent_limit: string;
                        provider_temporary_issue: string;
                    };
                };
            };
        };
        generate: {
            buttons: {
                generate: string;
                create: string;
                done: string;
                cancel: string;
                confirm: string;
            };
            labels: {
                woman: string;
                man: string;
                scene: string;
                wardrobe: string;
                creditsSuffix: string;
                requiresActiveSubscription: string;
                calculating: string;
            };
            aria: {
                selectStyle: string;
                selectScene: string;
                selectWardrobe: string;
                selectCharacter: string;
                openSettings: string;
                trainingProgress: string;
                characterActions: string;
                closeOverlay: string;
                carouselNavigation: string;
                previous: string;
                next: string;
                search: string;
            };
            placeholders: {
                find: string;
            };
            admin: {
                title: string;
                enableNodeOverrides: string;
                overridesJson: string;
                enablePromptOverride: string;
                prompt: string;
                characterMetadata: string;
            };
            errors: {
                failedToStartGeneration: string;
                selectCharacterToGenerate: string;
            };
        };
        inference: {
            common: {
                pleaseTryAgain: string;
                cancel: string;
            };
            time: {
                justNow: string;
                minutesAgo: string;
                hoursAgo: string;
                daysAgo: string;
            };
            gallery: {
                error: string;
                retry: string;
                loadingMore: string;
                endOfList: string;
                howItWorksAria: string;
                steps: {
                    choose: {
                        title: string;
                        desc: string;
                    };
                    character: {
                        title: string;
                        desc: string;
                    };
                    generate: {
                        title: string;
                        desc: string;
                    };
                };
            };
            viewer: {
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                    cancel: string;
                };
                closeAria: string;
                carousel: {
                    aria: string;
                    prevAria: string;
                    nextAria: string;
                };
                overlay: {
                    displayOriginal: string;
                    displayOriginalAria: string;
                    originalUnavailableTitle: string;
                    originalUnavailableDesc: string;
                };
                viewOriginal: {
                    label: string;
                    viewing: string;
                    aria: string;
                    viewingAria: string;
                };
                title: string;
                imageIndex: string;
                favourite: {
                    ariaButton: string;
                    add: string;
                    remove: string;
                    updateErrorTitle: string;
                };
                metadata: {
                    labels: {
                        aspectRatio: string;
                        quality: string;
                        model: string;
                        character: string;
                    };
                    aspectLabels: {
                        square: string;
                        landscape: string;
                        portrait: string;
                    };
                };
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                alt: {
                    generated: string;
                    thumbnail: string;
                };
            };
            group: {
                status: {
                    failed: string;
                };
                error: {
                    generic: string;
                    timeout: string;
                    serverBusy: string;
                    memory: string;
                    connection: string;
                    imageGeneration: string;
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
                deleteFailedTitle: string;
                rerun: {
                    cannot: string;
                    missingInfo: string;
                    failed: string;
                };
                header: {
                    shootTitle: string;
                };
                tooltips: {
                    deleteShoot: string;
                    rerunShoot: string;
                };
                aria: {
                    thumbnailsPreview: string;
                    viewAllImages: string;
                };
                alt: {
                    preview: string;
                };
                buttons: {
                    viewAll: string;
                };
            };
            thumbnail: {
                alt: {
                    generatingPreview: string;
                    generated: string;
                };
                favourite: {
                    add: string;
                    remove: string;
                };
                loadingTitle: string;
                loadingDesc: string;
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
            };
        };
        character: {
            nameLabel: string;
            creditsRequired: string;
            training: string;
            trainingInitializing: string;
            trainingInitializingInfo: string;
            trainingQueued: string;
            trainingQueuedInfo: string;
            trainingWarmingUp: string;
            trainingWarmingUpInfo: string;
            trainingPending: string;
            trainingPendingInfo: string;
            trainingRunning: string;
            trainingRunningNoCountdown: string;
            trainingRunningInfo: string;
            returnToApp: string;
            trainingError: string;
            trainingFailed: string;
            trainingFailedDescription: string;
            confirmClose: {
                title: string;
                description: string;
                progressMessages: {
                    upload: string;
                    profile: string;
                    name: string;
                };
                buttons: {
                    cancel: string;
                    confirm: string;
                };
            };
            errors: {
                trainingRetryFailed: string;
                retryError: string;
            };
            upload: {
                uploadingFiles: string;
                uploadingInfo: string;
            };
            dialogTitles: {
                onboardingIntro: string;
                onboardingGuidelines: string;
                onboardingConfirmation: string;
                upload: string;
                name: string;
                uploading: string;
                training: string;
            };
            dialogDescription: {
                upload: string;
                name: string;
                training: string;
                default: string;
            };
            beforeUnloadWarning: string;
            onboarding: {
                intro: {
                    title: string;
                    description1: string;
                    description2: string;
                    privacy: string;
                    buttonGetStarted: string;
                    buttonSkip: string;
                };
                confirmation: {
                    title: string;
                    paragraph1: string;
                    paragraph2: string;
                    buttonStart: string;
                };
                guidelines: {
                    naturalLight: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    angles: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    expressions: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    variety: {
                        title: string;
                        description: string;
                        description2: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                };
                buttons: {
                    next: string;
                };
                floatingAlt: string;
            };
            uploadStep: {
                petMode: string;
                bodyShotRequirementsNotMet: string;
            };
            nameStep: {
                noPreview: string;
                create: string;
                altPreview: string;
            };
            countdown: {
                fallback: string;
            };
            requirements: {
                header: {
                    title: string;
                    description: string;
                    secureNote: string;
                };
                sections: {
                    uploadTips: string;
                    dosDonts: string;
                };
                tips: {
                    blurredBackground: string;
                    naturalLight: string;
                    photos: string;
                    expression: string;
                    avoid: string;
                    clothing: string;
                    quantity: string;
                };
                dodonts: {
                    eyes: string;
                    lighting: string;
                    frame: string;
                    face: string;
                };
                altText: {
                    goodExample: string;
                    badExample: string;
                };
            };
            quality: {
                issues: {
                    image: {
                        lowResolution: string;
                        suboptimalResolution: string;
                        suboptimalResolutionLow: string;
                        tooDark: string;
                        tooBright: string;
                    };
                    face: {
                        none: string;
                        multiple: string;
                        positionNotOptimal: string;
                        detectSkipped: string;
                        angleExtreme: string;
                        sunglasses: string;
                        "sunglasses.critical": string;
                        eyesClosed: string;
                        tooSmall: string;
                        tooSmallToDetect: string;
                        tooLarge: string;
                        sizeNotOptimal: string;
                    };
                    contrast: {
                        separation: {
                            nearlyIdentical: string;
                            tooSimilar: string;
                            couldBeMoreDistinct: string;
                        };
                        poorOrFlat: string;
                    };
                    sharpness: {
                        tooBlurry: string;
                        pixelated: string;
                        suboptimal: string;
                    };
                    background: {
                        notBlurred: string;
                    };
                    upload: {
                        none: string;
                    };
                    body: {
                        minRequired: string;
                        tooMany: string;
                    };
                    score: {
                        tooLow: string;
                    };
                    eyes: {
                        maybeNotVisible: string;
                    };
                    reject: {
                        genericHint: string;
                    };
                };
            };
            uploader: {
                dragDropMessage: string;
                dragDropMoreMessage_one: string;
                dragDropMoreMessage_other: string;
                browse: string;
                supportedFormats: string;
                dropMessage: string;
                maxImagesReached: string;
            };
            status: {
                analyzing: string;
                checkingQuality: string;
            };
        };
        about: {
            mission: {
                line1: string;
            };
            paragraphs: string[];
            labels: {
                cofounders: string;
            };
        };
        legal: {
            common: {
                effectiveDate: string;
                endMarker: string;
                contact: string;
                email: string;
            };
            terms: {
                title: string;
                intro: string;
                sections: {
                    definitions: {
                        title: string;
                        items: {
                            service: string;
                            user: string;
                            userContent: string;
                            aiGenerated: string;
                            credits: string;
                        };
                    };
                    eligibility: {
                        title: string;
                        content: string;
                    };
                    userAccounts: {
                        title: string;
                        items: string[];
                    };
                    payments: {
                        title: string;
                        content: string;
                        refundsTitle: string;
                        refunds: string;
                        priceChangesTitle: string;
                        priceChanges: string;
                    };
                    ownership: {
                        title: string;
                        content: string;
                    };
                    prohibitedContent: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    aiGenerated: {
                        title: string;
                        content: string;
                    };
                    privacy: {
                        title: string;
                        content: string;
                    };
                    ip: {
                        title: string;
                        content: string;
                    };
                    liability: {
                        title: string;
                        content: string;
                    };
                    indemnity: {
                        title: string;
                        content: string;
                    };
                    termination: {
                        title: string;
                        content: string;
                    };
                    law: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    misc: {
                        title: string;
                        items: {
                            severability: string;
                            entireAgreement: string;
                            contact: string;
                        };
                    };
                };
            };
            privacy: {
                title: string;
                intro: string;
                sections: {
                    collect: {
                        title: string;
                        items: {
                            account: string;
                            userContent: string;
                            device: string;
                        };
                        note: string;
                    };
                    use: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    thirdParty: {
                        title: string;
                        items: {
                            aws: string;
                            stripe: string;
                        };
                        note: string;
                    };
                    cookies: {
                        title: string;
                        content: string;
                    };
                    retention: {
                        title: string;
                        content: string;
                    };
                    security: {
                        title: string;
                        intro: string;
                        items: string[];
                    };
                    rights: {
                        title: string;
                        intro: string;
                        items: string[];
                        contact: string;
                    };
                    children: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    contact: {
                        title: string;
                        content: string;
                    };
                };
            };
        };
        upload: {
            title: string;
            description: string;
            requirements: {
                title: string;
                description: string;
            };
            buttons: {
                upload: string;
                continue: string;
                retry: string;
            };
            errors: {
                invalidFile: string;
                fileTooLarge: string;
                uploadFailed: string;
                invalidFileType: string;
                fileSizeExceeded: string;
                duplicateFile: string;
                uploadFailedCount_one: string;
                uploadFailedCount_other: string;
            };
            progress: {
                uploading: string;
                processing: string;
                complete: string;
            };
            quality: {
                rejected: {
                    title: string;
                };
            };
        };
        homepage: {
            hero: {
                headline: string;
                tagline: string;
                subtitle: string;
            };
            story: {
                paragraph1: string;
                paragraph2: string;
                callToAction: string;
            };
            aria: {
                photoMetadata: string;
            };
            waitlist: {
                placeholder: string;
                ariaLabel: string;
                submitLabel: string;
                submittingLabel: string;
                validation: {
                    invalidEmail: string;
                };
                messages: {
                    alreadyOnWaitlist: string;
                    success: string;
                    defaultError: string;
                };
            };
        };
        account: {
            dialog: {
                title: string;
                selectSection: string;
            };
            navigation: {
                profile: string;
                subscription: string;
                settings: string;
                support: string;
            };
            buttons: {
                cancel: string;
                save: string;
                saving: string;
                signOut: string;
                subscribe: string;
                opening: string;
                manage: string;
                renew: string;
                buyCredits: string;
                deleteAccount: string;
            };
            profile: {
                title: string;
                firstName: string;
                lastName: string;
                email: string;
            };
            subscription: {
                title: string;
                loading: string;
                noPlan: string;
                planSuffix: string;
                cancelled: string;
                expires: string;
                renews: string;
                creditBalance: string;
                resets: string;
            };
            settings: {
                title: string;
                language: string;
                deleteAccount: {
                    title: string;
                    description: string;
                };
            };
            support: {
                title: string;
                description: string;
                faq: string;
                faqDescription: string;
                helpCenter: string;
                dmUs: string;
                emailUs: string;
            };
            errors: {
                failedToSave: string;
            };
            accessibility: {
                avatar: string;
                plan: string;
            };
        };
    };
    es: {
        common: {
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
                signIn: string;
            };
            navigation: {
                addStyles: string;
                payment: string;
                uploadPhotos: string;
                generate: string;
                explore: string;
                create: string;
                admin: string;
            };
            userNav: {
                signOut: string;
                accountSettings: string;
            };
            footer: {
                about: string;
                terms: string;
                privacy: string;
                copyright: string;
            };
            duration: {
                year_one: string;
                year_other: string;
                month_one: string;
                month_other: string;
                day_one: string;
                day_other: string;
            };
            aria: {
                favourites: string;
                avatar: string;
                brandLogo: string;
            };
            credits: {
                remaining_one: string;
                remaining_other: string;
            };
            contexts: {
                dialogService: {
                    defaultTitle: string;
                    defaultDescription: string;
                    notReadyWarning: string;
                };
                errors: {
                    missingProvider: {
                        styleSelection: string;
                        dialogService: string;
                        inferenceQueue: string;
                        carousel: string;
                        realtime: string;
                    };
                };
            };
        };
        auth: {
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
                emailInput: {
                    placeholder: string;
                    sendButton: string;
                    sendingButton: string;
                };
                social: {
                    button: string;
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
        pricing: {
            buyCredits: {
                title: string;
                description: string;
            };
            upgradePlan: {
                title: string;
                description: string;
            };
            purchase: {
                success: {
                    subscriptionTitle: string;
                    subscriptionTitleNew: string;
                    creditsTitle: string;
                    subscriptionDescriptionWithCredits: string;
                    subscriptionDescriptionWithCreditsNew: string;
                    subscriptionDescription: string;
                    subscriptionDescriptionNew: string;
                    creditsDescription: string;
                    returnToShoot: string;
                    defaultPlan: string;
                };
            };
            subscription: {
                context: {
                    characterLimit: {
                        title: string;
                        description: string;
                    };
                    qualityUpgrade: {
                        title: string;
                        description: string;
                    };
                    creditUpgrade: {
                        title: string;
                        description: string;
                    };
                    general: {
                        title: string;
                        description: string;
                    };
                    default: {
                        title: string;
                        description: string;
                    };
                };
                loading: string;
                empty: {
                    title: string;
                    description: string;
                };
                headers: {
                    chooseYourPlan: string;
                };
                banner: {
                    titleStart: string;
                    titleNumber: string;
                    description: {
                        start: string;
                        lifetime: string;
                        annualDiscount: string;
                        annualWord: string;
                        or: string;
                        monthlyDiscount: string;
                        monthlyWord: string;
                        end: string;
                    };
                    small: string;
                };
                toggle: {
                    monthly: string;
                    yearly: string;
                    aria: string;
                };
                card: {
                    recommended: string;
                    save: string;
                    perMonth: string;
                    billed: string;
                    creditsCount: string;
                    perMonthWord: string;
                    perCredit: string;
                    button: {
                        select: string;
                        current: string;
                        processing: string;
                        disabledTooltip: string;
                    };
                    features: {
                        quality: string;
                        characterIncluded: string;
                        maxCharacters: string;
                        concurrentShoots: string;
                        commercialUse: string;
                    };
                };
                footer: {
                    upgradeNotice: string;
                };
                toasts: {
                    loginRequired: string;
                    selectPlan: string;
                    invalidPlan: string;
                    openingPortal: string;
                    customerPortalFailed: string;
                    upgradePreviewFailed: string;
                    upgraded: string;
                    checkoutFailed: string;
                    invalidCheckout: string;
                };
            };
            credits: {
                dialog: {
                    headerSub: {
                        lowBalance: string;
                        creativity: string;
                    };
                    headerTitle: {
                        lowBalance: string;
                        fun: string;
                    };
                };
                card: {
                    images: string;
                    characters: string;
                    footnote: string;
                    button: {
                        buy: string;
                        processing: string;
                    };
                    validity: string;
                    oneTime: string;
                    perCredit: string;
                    perCreditWord: string;
                };
                toasts: {
                    loginRequired: string;
                    invalidPackConfig: string;
                    createCheckoutFailed: string;
                    purchaseFailed: string;
                };
            };
            comparisonTable: {
                categories: {
                    credits: string;
                    image: string;
                    characters: string;
                    generation: string;
                    support: string;
                };
                features: {
                    creditsPerMonth: string;
                    pricePerCredit: string;
                    resolution: string;
                    takesPerShoot: string;
                    portraitAspectRatio: string;
                    squareAspectRatio: string;
                    landscapeAspectRatio: string;
                    included: string;
                    storage: string;
                    concurrentShoots: string;
                    commercialUse: string;
                    priorityFeatures: string;
                    betaAccess: string;
                    emailSupport: string;
                    chatSupport: string;
                    dedicatedSupport: string;
                };
                values: {
                    upTo: string;
                };
            };
        };
        styles: {
            titles: {
                styleLabel: string;
                photoStyle: string;
                sceneLabel: string;
                wardrobeLabel: string;
                characterLabel: string;
                settingsLabel: string;
            };
            shoot: {
                subtitle: string;
            };
            character: {
                trainingQueued: string;
                trainingPending: string;
                trainingInitializing: string;
                remaining: string;
                photos: string;
                trainingFailedTitle: string;
                trainingFailedDesc: string;
            };
            qualities: {
                basic: string;
                medium: string;
                high: string;
            };
            labels: {
                credits: string;
                includedInPlan: string;
                limitReached: string;
                upgradePlanAddMore: string;
                upgradeOrBuyCredits: string;
                buyCredits: string;
                newStylesDropWeekly: string;
            };
            settings: {
                numberOfTakes: string;
                quality: string;
                aspectRatio: string;
            };
            status: {
                badge: {
                    pending: string;
                    queued: string;
                    initializing: string;
                    starting: string;
                    running: string;
                    generating: string;
                    completed: string;
                    failed: string;
                    connecting: string;
                };
                tooltip: {
                    pending: string;
                    queued: string;
                    queueReasons: {
                        character_not_ready: string;
                        concurrent_limit: string;
                        provider_temporary_issue: string;
                    };
                };
            };
        };
        generate: {
            buttons: {
                generate: string;
                create: string;
                done: string;
                cancel: string;
                confirm: string;
            };
            labels: {
                woman: string;
                man: string;
                scene: string;
                wardrobe: string;
                creditsSuffix: string;
                requiresActiveSubscription: string;
                calculating: string;
            };
            aria: {
                selectStyle: string;
                selectScene: string;
                selectWardrobe: string;
                selectCharacter: string;
                openSettings: string;
                trainingProgress: string;
                characterActions: string;
                closeOverlay: string;
                carouselNavigation: string;
                previous: string;
                next: string;
                search: string;
            };
            placeholders: {
                find: string;
            };
            admin: {
                title: string;
                enableNodeOverrides: string;
                overridesJson: string;
                enablePromptOverride: string;
                prompt: string;
                characterMetadata: string;
            };
            errors: {
                failedToStartGeneration: string;
                selectCharacterToGenerate: string;
            };
        };
        inference: {
            common: {
                pleaseTryAgain: string;
                cancel: string;
            };
            time: {
                justNow: string;
                minutesAgo: string;
                hoursAgo: string;
                daysAgo: string;
            };
            gallery: {
                error: string;
                retry: string;
                loadingMore: string;
                endOfList: string;
                howItWorksAria: string;
                steps: {
                    choose: {
                        title: string;
                        desc: string;
                    };
                    character: {
                        title: string;
                        desc: string;
                    };
                    generate: {
                        title: string;
                        desc: string;
                    };
                };
            };
            viewer: {
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                    cancel: string;
                };
                closeAria: string;
                carousel: {
                    aria: string;
                    prevAria: string;
                    nextAria: string;
                };
                overlay: {
                    displayOriginal: string;
                    displayOriginalAria: string;
                    originalUnavailableTitle: string;
                    originalUnavailableDesc: string;
                };
                viewOriginal: {
                    label: string;
                    viewing: string;
                    aria: string;
                    viewingAria: string;
                };
                title: string;
                imageIndex: string;
                favourite: {
                    ariaButton: string;
                    add: string;
                    remove: string;
                    updateErrorTitle: string;
                };
                metadata: {
                    labels: {
                        aspectRatio: string;
                        quality: string;
                        model: string;
                        character: string;
                    };
                    aspectLabels: {
                        square: string;
                        landscape: string;
                        portrait: string;
                    };
                };
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                alt: {
                    generated: string;
                    thumbnail: string;
                };
            };
            group: {
                status: {
                    failed: string;
                };
                error: {
                    generic: string;
                    timeout: string;
                    serverBusy: string;
                    memory: string;
                    connection: string;
                    imageGeneration: string;
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
                deleteFailedTitle: string;
                rerun: {
                    cannot: string;
                    missingInfo: string;
                    failed: string;
                };
                header: {
                    shootTitle: string;
                };
                tooltips: {
                    deleteShoot: string;
                    rerunShoot: string;
                };
                aria: {
                    thumbnailsPreview: string;
                    viewAllImages: string;
                };
                alt: {
                    preview: string;
                };
                buttons: {
                    viewAll: string;
                };
            };
            thumbnail: {
                alt: {
                    generatingPreview: string;
                    generated: string;
                };
                favourite: {
                    add: string;
                    remove: string;
                };
                loadingTitle: string;
                loadingDesc: string;
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
            };
        };
        character: {
            nameLabel: string;
            creditsRequired: string;
            training: string;
            trainingInitializing: string;
            trainingInitializingInfo: string;
            trainingQueued: string;
            trainingQueuedInfo: string;
            trainingWarmingUp: string;
            trainingWarmingUpInfo: string;
            trainingPending: string;
            trainingPendingInfo: string;
            trainingRunning: string;
            trainingRunningNoCountdown: string;
            trainingRunningInfo: string;
            returnToApp: string;
            trainingError: string;
            trainingFailed: string;
            trainingFailedDescription: string;
            confirmClose: {
                title: string;
                description: string;
                progressMessages: {
                    upload: string;
                    profile: string;
                    name: string;
                };
                buttons: {
                    cancel: string;
                    confirm: string;
                };
            };
            errors: {
                trainingRetryFailed: string;
                retryError: string;
            };
            upload: {
                uploadingFiles: string;
                uploadingInfo: string;
            };
            dialogTitles: {
                onboardingIntro: string;
                onboardingGuidelines: string;
                onboardingConfirmation: string;
                upload: string;
                name: string;
                uploading: string;
                training: string;
            };
            dialogDescription: {
                upload: string;
                name: string;
                training: string;
                default: string;
            };
            beforeUnloadWarning: string;
            onboarding: {
                intro: {
                    title: string;
                    description1: string;
                    description2: string;
                    privacy: string;
                    buttonGetStarted: string;
                    buttonSkip: string;
                };
                confirmation: {
                    title: string;
                    paragraph1: string;
                    paragraph2: string;
                    buttonStart: string;
                };
                guidelines: {
                    naturalLight: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    angles: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    expressions: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    variety: {
                        title: string;
                        description: string;
                        description2: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                };
                buttons: {
                    next: string;
                };
                floatingAlt: string;
            };
            uploadStep: {
                petMode: string;
                bodyShotRequirementsNotMet: string;
            };
            nameStep: {
                noPreview: string;
                create: string;
                altPreview: string;
            };
            countdown: {
                fallback: string;
            };
            requirements: {
                header: {
                    title: string;
                    description: string;
                    secureNote: string;
                };
                sections: {
                    uploadTips: string;
                    dosDonts: string;
                };
                tips: {
                    blurredBackground: string;
                    naturalLight: string;
                    photos: string;
                    expression: string;
                    avoid: string;
                    clothing: string;
                    quantity: string;
                };
                dodonts: {
                    eyes: string;
                    lighting: string;
                    frame: string;
                    face: string;
                };
                altText: {
                    goodExample: string;
                    badExample: string;
                };
            };
            quality: {
                issues: {
                    image: {
                        lowResolution: string;
                        suboptimalResolution: string;
                        suboptimalResolutionLow: string;
                        tooDark: string;
                        tooBright: string;
                    };
                    face: {
                        none: string;
                        multiple: string;
                        positionNotOptimal: string;
                        detectSkipped: string;
                        angleExtreme: string;
                        sunglasses: string;
                        "sunglasses.critical": string;
                        eyesClosed: string;
                        tooSmall: string;
                        tooSmallToDetect: string;
                        tooLarge: string;
                        sizeNotOptimal: string;
                    };
                    contrast: {
                        separation: {
                            nearlyIdentical: string;
                            tooSimilar: string;
                            couldBeMoreDistinct: string;
                        };
                        poorOrFlat: string;
                    };
                    sharpness: {
                        tooBlurry: string;
                        pixelated: string;
                        suboptimal: string;
                    };
                    background: {
                        notBlurred: string;
                    };
                    upload: {
                        none: string;
                    };
                    body: {
                        minRequired: string;
                        tooMany: string;
                    };
                    score: {
                        tooLow: string;
                    };
                    eyes: {
                        maybeNotVisible: string;
                    };
                    reject: {
                        genericHint: string;
                    };
                };
            };
            uploader: {
                dragDropMessage: string;
                dragDropMoreMessage_one: string;
                dragDropMoreMessage_other: string;
                browse: string;
                supportedFormats: string;
                dropMessage: string;
                maxImagesReached: string;
            };
            status: {
                analyzing: string;
                checkingQuality: string;
            };
        };
        about: {
            mission: {
                line1: string;
            };
            paragraphs: string[];
            labels: {
                cofounders: string;
            };
        };
        legal: {
            common: {
                effectiveDate: string;
                endMarker: string;
                contact: string;
                email: string;
            };
            terms: {
                title: string;
                intro: string;
                sections: {
                    definitions: {
                        title: string;
                        items: {
                            service: string;
                            user: string;
                            userContent: string;
                            aiGenerated: string;
                            credits: string;
                        };
                    };
                    eligibility: {
                        title: string;
                        content: string;
                    };
                    userAccounts: {
                        title: string;
                        items: string[];
                    };
                    payments: {
                        title: string;
                        content: string;
                        refundsTitle: string;
                        refunds: string;
                        priceChangesTitle: string;
                        priceChanges: string;
                    };
                    ownership: {
                        title: string;
                        content: string;
                    };
                    prohibitedContent: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    aiGenerated: {
                        title: string;
                        content: string;
                    };
                    privacy: {
                        title: string;
                        content: string;
                    };
                    ip: {
                        title: string;
                        content: string;
                    };
                    liability: {
                        title: string;
                        content: string;
                    };
                    indemnity: {
                        title: string;
                        content: string;
                    };
                    termination: {
                        title: string;
                        content: string;
                    };
                    law: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    misc: {
                        title: string;
                        items: {
                            severability: string;
                            entireAgreement: string;
                            contact: string;
                        };
                    };
                };
            };
            privacy: {
                title: string;
                intro: string;
                sections: {
                    collect: {
                        title: string;
                        items: {
                            account: string;
                            userContent: string;
                            device: string;
                        };
                        note: string;
                    };
                    use: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    thirdParty: {
                        title: string;
                        items: {
                            aws: string;
                            stripe: string;
                        };
                        note: string;
                    };
                    cookies: {
                        title: string;
                        content: string;
                    };
                    retention: {
                        title: string;
                        content: string;
                    };
                    security: {
                        title: string;
                        intro: string;
                        items: string[];
                    };
                    rights: {
                        title: string;
                        intro: string;
                        items: string[];
                        contact: string;
                    };
                    children: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    contact: {
                        title: string;
                        content: string;
                    };
                };
            };
        };
        upload: {
            title: string;
            description: string;
            requirements: {
                title: string;
                description: string;
            };
            buttons: {
                upload: string;
                continue: string;
                retry: string;
            };
            errors: {
                invalidFile: string;
                fileTooLarge: string;
                uploadFailed: string;
                invalidFileType: string;
                fileSizeExceeded: string;
                duplicateFile: string;
                uploadFailedCount_one: string;
                uploadFailedCount_other: string;
            };
            progress: {
                uploading: string;
                processing: string;
                complete: string;
            };
            quality: {
                rejected: {
                    title: string;
                };
            };
        };
        homepage: {
            hero: {
                headline: string;
                tagline: string;
                subtitle: string;
            };
            story: {
                paragraph1: string;
                paragraph2: string;
                callToAction: string;
            };
            aria: {
                photoMetadata: string;
            };
            waitlist: {
                placeholder: string;
                ariaLabel: string;
                submitLabel: string;
                submittingLabel: string;
                validation: {
                    invalidEmail: string;
                };
                messages: {
                    alreadyOnWaitlist: string;
                    success: string;
                    defaultError: string;
                };
            };
        };
        account: {
            dialog: {
                title: string;
                selectSection: string;
            };
            navigation: {
                profile: string;
                subscription: string;
                settings: string;
                support: string;
            };
            buttons: {
                cancel: string;
                save: string;
                saving: string;
                signOut: string;
                subscribe: string;
                opening: string;
                manage: string;
                renew: string;
                buyCredits: string;
                deleteAccount: string;
            };
            profile: {
                title: string;
                firstName: string;
                lastName: string;
                email: string;
            };
            subscription: {
                title: string;
                loading: string;
                noPlan: string;
                planSuffix: string;
                cancelled: string;
                expires: string;
                renews: string;
                creditBalance: string;
                resets: string;
            };
            settings: {
                title: string;
                language: string;
                deleteAccount: {
                    title: string;
                    description: string;
                };
            };
            support: {
                title: string;
                description: string;
                faq: string;
                faqDescription: string;
                helpCenter: string;
                dmUs: string;
                emailUs: string;
            };
            errors: {
                failedToSave: string;
            };
            accessibility: {
                avatar: string;
                plan: string;
            };
        };
    };
    it: {
        common: {
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
                signIn: string;
            };
            navigation: {
                addStyles: string;
                payment: string;
                uploadPhotos: string;
                generate: string;
                explore: string;
                create: string;
                admin: string;
            };
            userNav: {
                signOut: string;
                accountSettings: string;
            };
            footer: {
                about: string;
                terms: string;
                privacy: string;
                copyright: string;
            };
            duration: {
                year_one: string;
                year_other: string;
                month_one: string;
                month_other: string;
                day_one: string;
                day_other: string;
            };
            aria: {
                favourites: string;
                avatar: string;
                brandLogo: string;
            };
            credits: {
                remaining_one: string;
                remaining_other: string;
            };
            contexts: {
                dialogService: {
                    defaultTitle: string;
                    defaultDescription: string;
                    notReadyWarning: string;
                };
                errors: {
                    missingProvider: {
                        styleSelection: string;
                        dialogService: string;
                        inferenceQueue: string;
                        carousel: string;
                        realtime: string;
                    };
                };
            };
        };
        auth: {
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
                emailInput: {
                    placeholder: string;
                    sendButton: string;
                    sendingButton: string;
                };
                social: {
                    button: string;
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
        pricing: {
            buyCredits: {
                title: string;
                description: string;
            };
            upgradePlan: {
                title: string;
                description: string;
            };
            purchase: {
                success: {
                    subscriptionTitle: string;
                    subscriptionTitleNew: string;
                    creditsTitle: string;
                    subscriptionDescriptionWithCredits: string;
                    subscriptionDescriptionWithCreditsNew: string;
                    subscriptionDescription: string;
                    subscriptionDescriptionNew: string;
                    creditsDescription: string;
                    returnToShoot: string;
                    defaultPlan: string;
                };
            };
            subscription: {
                context: {
                    characterLimit: {
                        title: string;
                        description: string;
                    };
                    qualityUpgrade: {
                        title: string;
                        description: string;
                    };
                    creditUpgrade: {
                        title: string;
                        description: string;
                    };
                    general: {
                        title: string;
                        description: string;
                    };
                    default: {
                        title: string;
                        description: string;
                    };
                };
                loading: string;
                empty: {
                    title: string;
                    description: string;
                };
                headers: {
                    chooseYourPlan: string;
                };
                banner: {
                    titleStart: string;
                    titleNumber: string;
                    description: {
                        start: string;
                        lifetime: string;
                        annualDiscount: string;
                        annualWord: string;
                        or: string;
                        monthlyDiscount: string;
                        monthlyWord: string;
                        end: string;
                    };
                    small: string;
                };
                toggle: {
                    monthly: string;
                    yearly: string;
                    aria: string;
                };
                card: {
                    recommended: string;
                    save: string;
                    perMonth: string;
                    billed: string;
                    creditsCount: string;
                    perMonthWord: string;
                    perCredit: string;
                    button: {
                        select: string;
                        current: string;
                        processing: string;
                        disabledTooltip: string;
                    };
                    features: {
                        quality: string;
                        characterIncluded: string;
                        maxCharacters: string;
                        concurrentShoots: string;
                        commercialUse: string;
                    };
                };
                footer: {
                    upgradeNotice: string;
                };
                toasts: {
                    loginRequired: string;
                    selectPlan: string;
                    invalidPlan: string;
                    openingPortal: string;
                    customerPortalFailed: string;
                    upgradePreviewFailed: string;
                    upgraded: string;
                    checkoutFailed: string;
                    invalidCheckout: string;
                };
            };
            credits: {
                dialog: {
                    headerSub: {
                        lowBalance: string;
                        creativity: string;
                    };
                    headerTitle: {
                        lowBalance: string;
                        fun: string;
                    };
                };
                card: {
                    images: string;
                    characters: string;
                    footnote: string;
                    button: {
                        buy: string;
                        processing: string;
                    };
                    validity: string;
                    oneTime: string;
                    perCredit: string;
                    perCreditWord: string;
                };
                toasts: {
                    loginRequired: string;
                    invalidPackConfig: string;
                    createCheckoutFailed: string;
                    purchaseFailed: string;
                };
            };
            comparisonTable: {
                categories: {
                    credits: string;
                    image: string;
                    characters: string;
                    generation: string;
                    support: string;
                };
                features: {
                    creditsPerMonth: string;
                    pricePerCredit: string;
                    resolution: string;
                    takesPerShoot: string;
                    portraitAspectRatio: string;
                    squareAspectRatio: string;
                    landscapeAspectRatio: string;
                    included: string;
                    storage: string;
                    concurrentShoots: string;
                    commercialUse: string;
                    priorityFeatures: string;
                    betaAccess: string;
                    emailSupport: string;
                    chatSupport: string;
                    dedicatedSupport: string;
                };
                values: {
                    upTo: string;
                };
            };
        };
        styles: {
            titles: {
                styleLabel: string;
                photoStyle: string;
                sceneLabel: string;
                wardrobeLabel: string;
                characterLabel: string;
                settingsLabel: string;
            };
            shoot: {
                subtitle: string;
            };
            character: {
                trainingQueued: string;
                trainingPending: string;
                trainingInitializing: string;
                remaining: string;
                photos: string;
                trainingFailedTitle: string;
                trainingFailedDesc: string;
            };
            qualities: {
                basic: string;
                medium: string;
                high: string;
            };
            labels: {
                credits: string;
                includedInPlan: string;
                limitReached: string;
                upgradePlanAddMore: string;
                upgradeOrBuyCredits: string;
                buyCredits: string;
                newStylesDropWeekly: string;
            };
            settings: {
                numberOfTakes: string;
                quality: string;
                aspectRatio: string;
            };
            status: {
                badge: {
                    pending: string;
                    queued: string;
                    initializing: string;
                    starting: string;
                    running: string;
                    generating: string;
                    completed: string;
                    failed: string;
                    connecting: string;
                };
                tooltip: {
                    pending: string;
                    queued: string;
                    queueReasons: {
                        character_not_ready: string;
                        concurrent_limit: string;
                        provider_temporary_issue: string;
                    };
                };
            };
        };
        generate: {
            buttons: {
                generate: string;
                create: string;
                done: string;
                cancel: string;
                confirm: string;
            };
            labels: {
                woman: string;
                man: string;
                scene: string;
                wardrobe: string;
                creditsSuffix: string;
                requiresActiveSubscription: string;
                calculating: string;
            };
            aria: {
                selectStyle: string;
                selectScene: string;
                selectWardrobe: string;
                selectCharacter: string;
                openSettings: string;
                trainingProgress: string;
                characterActions: string;
                closeOverlay: string;
                carouselNavigation: string;
                previous: string;
                next: string;
                search: string;
            };
            placeholders: {
                find: string;
            };
            admin: {
                title: string;
                enableNodeOverrides: string;
                overridesJson: string;
                enablePromptOverride: string;
                prompt: string;
                characterMetadata: string;
            };
            errors: {
                failedToStartGeneration: string;
                selectCharacterToGenerate: string;
            };
        };
        inference: {
            common: {
                pleaseTryAgain: string;
                cancel: string;
            };
            time: {
                justNow: string;
                minutesAgo: string;
                hoursAgo: string;
                daysAgo: string;
            };
            gallery: {
                error: string;
                retry: string;
                loadingMore: string;
                endOfList: string;
                howItWorksAria: string;
                steps: {
                    choose: {
                        title: string;
                        desc: string;
                    };
                    character: {
                        title: string;
                        desc: string;
                    };
                    generate: {
                        title: string;
                        desc: string;
                    };
                };
            };
            viewer: {
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                    cancel: string;
                };
                closeAria: string;
                carousel: {
                    aria: string;
                    prevAria: string;
                    nextAria: string;
                };
                overlay: {
                    displayOriginal: string;
                    displayOriginalAria: string;
                    originalUnavailableTitle: string;
                    originalUnavailableDesc: string;
                };
                viewOriginal: {
                    label: string;
                    viewing: string;
                    aria: string;
                    viewingAria: string;
                };
                title: string;
                imageIndex: string;
                favourite: {
                    ariaButton: string;
                    add: string;
                    remove: string;
                    updateErrorTitle: string;
                };
                metadata: {
                    labels: {
                        aspectRatio: string;
                        quality: string;
                        model: string;
                        character: string;
                    };
                    aspectLabels: {
                        square: string;
                        landscape: string;
                        portrait: string;
                    };
                };
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                alt: {
                    generated: string;
                    thumbnail: string;
                };
            };
            group: {
                status: {
                    failed: string;
                };
                error: {
                    generic: string;
                    timeout: string;
                    serverBusy: string;
                    memory: string;
                    connection: string;
                    imageGeneration: string;
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
                deleteFailedTitle: string;
                rerun: {
                    cannot: string;
                    missingInfo: string;
                    failed: string;
                };
                header: {
                    shootTitle: string;
                };
                tooltips: {
                    deleteShoot: string;
                    rerunShoot: string;
                };
                aria: {
                    thumbnailsPreview: string;
                    viewAllImages: string;
                };
                alt: {
                    preview: string;
                };
                buttons: {
                    viewAll: string;
                };
            };
            thumbnail: {
                alt: {
                    generatingPreview: string;
                    generated: string;
                };
                favourite: {
                    add: string;
                    remove: string;
                };
                loadingTitle: string;
                loadingDesc: string;
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
            };
        };
        character: {
            nameLabel: string;
            creditsRequired: string;
            training: string;
            trainingInitializing: string;
            trainingInitializingInfo: string;
            trainingQueued: string;
            trainingQueuedInfo: string;
            trainingWarmingUp: string;
            trainingWarmingUpInfo: string;
            trainingPending: string;
            trainingPendingInfo: string;
            trainingRunning: string;
            trainingRunningNoCountdown: string;
            trainingRunningInfo: string;
            returnToApp: string;
            trainingError: string;
            trainingFailed: string;
            trainingFailedDescription: string;
            confirmClose: {
                title: string;
                description: string;
                progressMessages: {
                    upload: string;
                    profile: string;
                    name: string;
                };
                buttons: {
                    cancel: string;
                    confirm: string;
                };
            };
            errors: {
                trainingRetryFailed: string;
                retryError: string;
            };
            upload: {
                uploadingFiles: string;
                uploadingInfo: string;
            };
            dialogTitles: {
                onboardingIntro: string;
                onboardingGuidelines: string;
                onboardingConfirmation: string;
                upload: string;
                name: string;
                uploading: string;
                training: string;
            };
            dialogDescription: {
                upload: string;
                name: string;
                training: string;
                default: string;
            };
            beforeUnloadWarning: string;
            onboarding: {
                intro: {
                    title: string;
                    description1: string;
                    description2: string;
                    privacy: string;
                    buttonGetStarted: string;
                    buttonSkip: string;
                };
                confirmation: {
                    title: string;
                    paragraph1: string;
                    paragraph2: string;
                    buttonStart: string;
                };
                guidelines: {
                    naturalLight: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    angles: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    expressions: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    variety: {
                        title: string;
                        description: string;
                        description2: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                };
                buttons: {
                    next: string;
                };
                floatingAlt: string;
            };
            uploadStep: {
                petMode: string;
                bodyShotRequirementsNotMet: string;
            };
            nameStep: {
                noPreview: string;
                create: string;
                altPreview: string;
            };
            countdown: {
                fallback: string;
            };
            requirements: {
                header: {
                    title: string;
                    description: string;
                    secureNote: string;
                };
                sections: {
                    uploadTips: string;
                    dosDonts: string;
                };
                tips: {
                    blurredBackground: string;
                    naturalLight: string;
                    photos: string;
                    expression: string;
                    avoid: string;
                    clothing: string;
                    quantity: string;
                };
                dodonts: {
                    eyes: string;
                    lighting: string;
                    frame: string;
                    face: string;
                };
                altText: {
                    goodExample: string;
                    badExample: string;
                };
            };
            quality: {
                issues: {
                    image: {
                        lowResolution: string;
                        suboptimalResolution: string;
                        suboptimalResolutionLow: string;
                        tooDark: string;
                        tooBright: string;
                    };
                    face: {
                        none: string;
                        multiple: string;
                        positionNotOptimal: string;
                        detectSkipped: string;
                        angleExtreme: string;
                        sunglasses: string;
                        "sunglasses.critical": string;
                        eyesClosed: string;
                        tooSmall: string;
                        tooSmallToDetect: string;
                        tooLarge: string;
                        sizeNotOptimal: string;
                    };
                    contrast: {
                        separation: {
                            nearlyIdentical: string;
                            tooSimilar: string;
                            couldBeMoreDistinct: string;
                        };
                        poorOrFlat: string;
                    };
                    sharpness: {
                        tooBlurry: string;
                        pixelated: string;
                        suboptimal: string;
                    };
                    background: {
                        notBlurred: string;
                    };
                    upload: {
                        none: string;
                    };
                    body: {
                        minRequired: string;
                        tooMany: string;
                    };
                    score: {
                        tooLow: string;
                    };
                    eyes: {
                        maybeNotVisible: string;
                    };
                    reject: {
                        genericHint: string;
                    };
                };
            };
            uploader: {
                dragDropMessage: string;
                dragDropMoreMessage_one: string;
                dragDropMoreMessage_other: string;
                browse: string;
                supportedFormats: string;
                dropMessage: string;
                maxImagesReached: string;
            };
            status: {
                analyzing: string;
                checkingQuality: string;
            };
        };
        about: {
            mission: {
                line1: string;
            };
            paragraphs: string[];
            labels: {
                cofounders: string;
            };
        };
        legal: {
            common: {
                effectiveDate: string;
                endMarker: string;
                contact: string;
                email: string;
            };
            terms: {
                title: string;
                intro: string;
                sections: {
                    definitions: {
                        title: string;
                        items: {
                            service: string;
                            user: string;
                            userContent: string;
                            aiGenerated: string;
                            credits: string;
                        };
                    };
                    eligibility: {
                        title: string;
                        content: string;
                    };
                    userAccounts: {
                        title: string;
                        items: string[];
                    };
                    payments: {
                        title: string;
                        content: string;
                        refundsTitle: string;
                        refunds: string;
                        priceChangesTitle: string;
                        priceChanges: string;
                    };
                    ownership: {
                        title: string;
                        content: string;
                    };
                    prohibitedContent: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    aiGenerated: {
                        title: string;
                        content: string;
                    };
                    privacy: {
                        title: string;
                        content: string;
                    };
                    ip: {
                        title: string;
                        content: string;
                    };
                    liability: {
                        title: string;
                        content: string;
                    };
                    indemnity: {
                        title: string;
                        content: string;
                    };
                    termination: {
                        title: string;
                        content: string;
                    };
                    law: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    misc: {
                        title: string;
                        items: {
                            severability: string;
                            entireAgreement: string;
                            contact: string;
                        };
                    };
                };
            };
            privacy: {
                title: string;
                intro: string;
                sections: {
                    collect: {
                        title: string;
                        items: {
                            account: string;
                            userContent: string;
                            device: string;
                        };
                        note: string;
                    };
                    use: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    thirdParty: {
                        title: string;
                        items: {
                            aws: string;
                            stripe: string;
                        };
                        note: string;
                    };
                    cookies: {
                        title: string;
                        content: string;
                    };
                    retention: {
                        title: string;
                        content: string;
                    };
                    security: {
                        title: string;
                        intro: string;
                        items: string[];
                    };
                    rights: {
                        title: string;
                        intro: string;
                        items: string[];
                        contact: string;
                    };
                    children: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    contact: {
                        title: string;
                        content: string;
                    };
                };
            };
        };
        upload: {
            title: string;
            description: string;
            requirements: {
                title: string;
                description: string;
            };
            buttons: {
                upload: string;
                continue: string;
                retry: string;
            };
            errors: {
                invalidFile: string;
                fileTooLarge: string;
                uploadFailed: string;
                invalidFileType: string;
                fileSizeExceeded: string;
                duplicateFile: string;
                uploadFailedCount_one: string;
                uploadFailedCount_other: string;
            };
            progress: {
                uploading: string;
                processing: string;
                complete: string;
            };
            quality: {
                rejected: {
                    title: string;
                };
            };
        };
        homepage: {
            hero: {
                headline: string;
                tagline: string;
                subtitle: string;
            };
            story: {
                paragraph1: string;
                paragraph2: string;
                callToAction: string;
            };
            aria: {
                photoMetadata: string;
            };
            waitlist: {
                placeholder: string;
                ariaLabel: string;
                submitLabel: string;
                submittingLabel: string;
                validation: {
                    invalidEmail: string;
                };
                messages: {
                    alreadyOnWaitlist: string;
                    success: string;
                    defaultError: string;
                };
            };
        };
        account: {
            dialog: {
                title: string;
                selectSection: string;
            };
            navigation: {
                profile: string;
                subscription: string;
                settings: string;
                support: string;
            };
            buttons: {
                cancel: string;
                save: string;
                saving: string;
                signOut: string;
                subscribe: string;
                opening: string;
                manage: string;
                renew: string;
                buyCredits: string;
                deleteAccount: string;
            };
            profile: {
                title: string;
                firstName: string;
                lastName: string;
                email: string;
            };
            subscription: {
                title: string;
                loading: string;
                noPlan: string;
                planSuffix: string;
                cancelled: string;
                expires: string;
                renews: string;
                creditBalance: string;
                resets: string;
            };
            settings: {
                title: string;
                language: string;
                deleteAccount: {
                    title: string;
                    description: string;
                };
            };
            support: {
                title: string;
                description: string;
                faq: string;
                faqDescription: string;
                helpCenter: string;
                dmUs: string;
                emailUs: string;
            };
            errors: {
                failedToSave: string;
            };
            accessibility: {
                avatar: string;
                plan: string;
            };
        };
    };
    pt: {
        common: {
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
                signIn: string;
            };
            navigation: {
                addStyles: string;
                payment: string;
                uploadPhotos: string;
                generate: string;
                explore: string;
                create: string;
                admin: string;
            };
            userNav: {
                signOut: string;
                accountSettings: string;
            };
            footer: {
                about: string;
                terms: string;
                privacy: string;
                copyright: string;
            };
            duration: {
                year_one: string;
                year_other: string;
                month_one: string;
                month_other: string;
                day_one: string;
                day_other: string;
            };
            aria: {
                favourites: string;
                avatar: string;
                brandLogo: string;
            };
            credits: {
                remaining_one: string;
                remaining_other: string;
            };
            contexts: {
                dialogService: {
                    defaultTitle: string;
                    defaultDescription: string;
                    notReadyWarning: string;
                };
                errors: {
                    missingProvider: {
                        styleSelection: string;
                        dialogService: string;
                        inferenceQueue: string;
                        carousel: string;
                        realtime: string;
                    };
                };
            };
        };
        auth: {
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
                emailInput: {
                    placeholder: string;
                    sendButton: string;
                    sendingButton: string;
                };
                social: {
                    button: string;
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
        pricing: {
            buyCredits: {
                title: string;
                description: string;
            };
            upgradePlan: {
                title: string;
                description: string;
            };
            purchase: {
                success: {
                    subscriptionTitle: string;
                    subscriptionTitleNew: string;
                    creditsTitle: string;
                    subscriptionDescriptionWithCredits: string;
                    subscriptionDescriptionWithCreditsNew: string;
                    subscriptionDescription: string;
                    subscriptionDescriptionNew: string;
                    creditsDescription: string;
                    returnToShoot: string;
                    defaultPlan: string;
                };
            };
            subscription: {
                context: {
                    characterLimit: {
                        title: string;
                        description: string;
                    };
                    qualityUpgrade: {
                        title: string;
                        description: string;
                    };
                    creditUpgrade: {
                        title: string;
                        description: string;
                    };
                    general: {
                        title: string;
                        description: string;
                    };
                    default: {
                        title: string;
                        description: string;
                    };
                };
                loading: string;
                empty: {
                    title: string;
                    description: string;
                };
                headers: {
                    chooseYourPlan: string;
                };
                banner: {
                    titleStart: string;
                    titleNumber: string;
                    description: {
                        start: string;
                        lifetime: string;
                        annualDiscount: string;
                        annualWord: string;
                        or: string;
                        monthlyDiscount: string;
                        monthlyWord: string;
                        end: string;
                    };
                    small: string;
                };
                toggle: {
                    monthly: string;
                    yearly: string;
                    aria: string;
                };
                card: {
                    recommended: string;
                    save: string;
                    perMonth: string;
                    billed: string;
                    creditsCount: string;
                    perMonthWord: string;
                    perCredit: string;
                    button: {
                        select: string;
                        current: string;
                        processing: string;
                        disabledTooltip: string;
                    };
                    features: {
                        quality: string;
                        characterIncluded: string;
                        maxCharacters: string;
                        concurrentShoots: string;
                        commercialUse: string;
                    };
                };
                footer: {
                    upgradeNotice: string;
                };
                toasts: {
                    loginRequired: string;
                    selectPlan: string;
                    invalidPlan: string;
                    openingPortal: string;
                    customerPortalFailed: string;
                    upgradePreviewFailed: string;
                    upgraded: string;
                    checkoutFailed: string;
                    invalidCheckout: string;
                };
            };
            credits: {
                dialog: {
                    headerSub: {
                        lowBalance: string;
                        creativity: string;
                    };
                    headerTitle: {
                        lowBalance: string;
                        fun: string;
                    };
                };
                card: {
                    images: string;
                    characters: string;
                    footnote: string;
                    button: {
                        buy: string;
                        processing: string;
                    };
                    validity: string;
                    oneTime: string;
                    perCredit: string;
                    perCreditWord: string;
                };
                toasts: {
                    loginRequired: string;
                    invalidPackConfig: string;
                    createCheckoutFailed: string;
                    purchaseFailed: string;
                };
            };
            comparisonTable: {
                categories: {
                    credits: string;
                    image: string;
                    characters: string;
                    generation: string;
                    support: string;
                };
                features: {
                    creditsPerMonth: string;
                    pricePerCredit: string;
                    resolution: string;
                    takesPerShoot: string;
                    portraitAspectRatio: string;
                    squareAspectRatio: string;
                    landscapeAspectRatio: string;
                    included: string;
                    storage: string;
                    concurrentShoots: string;
                    commercialUse: string;
                    priorityFeatures: string;
                    betaAccess: string;
                    emailSupport: string;
                    chatSupport: string;
                    dedicatedSupport: string;
                };
                values: {
                    upTo: string;
                };
            };
        };
        styles: {
            titles: {
                styleLabel: string;
                photoStyle: string;
                sceneLabel: string;
                wardrobeLabel: string;
                characterLabel: string;
                settingsLabel: string;
            };
            shoot: {
                subtitle: string;
            };
            character: {
                trainingQueued: string;
                trainingPending: string;
                trainingInitializing: string;
                remaining: string;
                photos: string;
                trainingFailedTitle: string;
                trainingFailedDesc: string;
            };
            qualities: {
                basic: string;
                medium: string;
                high: string;
            };
            labels: {
                credits: string;
                includedInPlan: string;
                limitReached: string;
                upgradePlanAddMore: string;
                upgradeOrBuyCredits: string;
                buyCredits: string;
                newStylesDropWeekly: string;
            };
            settings: {
                numberOfTakes: string;
                quality: string;
                aspectRatio: string;
            };
            status: {
                badge: {
                    pending: string;
                    queued: string;
                    initializing: string;
                    starting: string;
                    running: string;
                    generating: string;
                    completed: string;
                    failed: string;
                    connecting: string;
                };
                tooltip: {
                    pending: string;
                    queued: string;
                    queueReasons: {
                        character_not_ready: string;
                        concurrent_limit: string;
                        provider_temporary_issue: string;
                    };
                };
            };
        };
        generate: {
            buttons: {
                generate: string;
                create: string;
                done: string;
                cancel: string;
                confirm: string;
            };
            labels: {
                woman: string;
                man: string;
                scene: string;
                wardrobe: string;
                creditsSuffix: string;
                requiresActiveSubscription: string;
                calculating: string;
            };
            aria: {
                selectStyle: string;
                selectScene: string;
                selectWardrobe: string;
                selectCharacter: string;
                openSettings: string;
                trainingProgress: string;
                characterActions: string;
                closeOverlay: string;
                carouselNavigation: string;
                previous: string;
                next: string;
                search: string;
            };
            placeholders: {
                find: string;
            };
            admin: {
                title: string;
                enableNodeOverrides: string;
                overridesJson: string;
                enablePromptOverride: string;
                prompt: string;
                characterMetadata: string;
            };
            errors: {
                failedToStartGeneration: string;
                selectCharacterToGenerate: string;
            };
        };
        inference: {
            common: {
                pleaseTryAgain: string;
                cancel: string;
            };
            time: {
                justNow: string;
                minutesAgo: string;
                hoursAgo: string;
                daysAgo: string;
            };
            gallery: {
                error: string;
                retry: string;
                loadingMore: string;
                endOfList: string;
                howItWorksAria: string;
                steps: {
                    choose: {
                        title: string;
                        desc: string;
                    };
                    character: {
                        title: string;
                        desc: string;
                    };
                    generate: {
                        title: string;
                        desc: string;
                    };
                };
            };
            viewer: {
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                    cancel: string;
                };
                closeAria: string;
                carousel: {
                    aria: string;
                    prevAria: string;
                    nextAria: string;
                };
                overlay: {
                    displayOriginal: string;
                    displayOriginalAria: string;
                    originalUnavailableTitle: string;
                    originalUnavailableDesc: string;
                };
                viewOriginal: {
                    label: string;
                    viewing: string;
                    aria: string;
                    viewingAria: string;
                };
                title: string;
                imageIndex: string;
                favourite: {
                    ariaButton: string;
                    add: string;
                    remove: string;
                    updateErrorTitle: string;
                };
                metadata: {
                    labels: {
                        aspectRatio: string;
                        quality: string;
                        model: string;
                        character: string;
                    };
                    aspectLabels: {
                        square: string;
                        landscape: string;
                        portrait: string;
                    };
                };
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                alt: {
                    generated: string;
                    thumbnail: string;
                };
            };
            group: {
                status: {
                    failed: string;
                };
                error: {
                    generic: string;
                    timeout: string;
                    serverBusy: string;
                    memory: string;
                    connection: string;
                    imageGeneration: string;
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
                deleteFailedTitle: string;
                rerun: {
                    cannot: string;
                    missingInfo: string;
                    failed: string;
                };
                header: {
                    shootTitle: string;
                };
                tooltips: {
                    deleteShoot: string;
                    rerunShoot: string;
                };
                aria: {
                    thumbnailsPreview: string;
                    viewAllImages: string;
                };
                alt: {
                    preview: string;
                };
                buttons: {
                    viewAll: string;
                };
            };
            thumbnail: {
                alt: {
                    generatingPreview: string;
                    generated: string;
                };
                favourite: {
                    add: string;
                    remove: string;
                };
                loadingTitle: string;
                loadingDesc: string;
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
            };
        };
        character: {
            nameLabel: string;
            creditsRequired: string;
            training: string;
            trainingInitializing: string;
            trainingInitializingInfo: string;
            trainingQueued: string;
            trainingQueuedInfo: string;
            trainingWarmingUp: string;
            trainingWarmingUpInfo: string;
            trainingPending: string;
            trainingPendingInfo: string;
            trainingRunning: string;
            trainingRunningNoCountdown: string;
            trainingRunningInfo: string;
            returnToApp: string;
            trainingError: string;
            trainingFailed: string;
            trainingFailedDescription: string;
            confirmClose: {
                title: string;
                description: string;
                progressMessages: {
                    upload: string;
                    profile: string;
                    name: string;
                };
                buttons: {
                    cancel: string;
                    confirm: string;
                };
            };
            errors: {
                trainingRetryFailed: string;
                retryError: string;
            };
            upload: {
                uploadingFiles: string;
                uploadingInfo: string;
            };
            dialogTitles: {
                onboardingIntro: string;
                onboardingGuidelines: string;
                onboardingConfirmation: string;
                upload: string;
                name: string;
                uploading: string;
                training: string;
            };
            dialogDescription: {
                upload: string;
                name: string;
                training: string;
                default: string;
            };
            beforeUnloadWarning: string;
            onboarding: {
                intro: {
                    title: string;
                    description1: string;
                    description2: string;
                    privacy: string;
                    buttonGetStarted: string;
                    buttonSkip: string;
                };
                confirmation: {
                    title: string;
                    paragraph1: string;
                    paragraph2: string;
                    buttonStart: string;
                };
                guidelines: {
                    naturalLight: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    angles: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    expressions: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    variety: {
                        title: string;
                        description: string;
                        description2: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                };
                buttons: {
                    next: string;
                };
                floatingAlt: string;
            };
            uploadStep: {
                petMode: string;
                bodyShotRequirementsNotMet: string;
            };
            nameStep: {
                noPreview: string;
                create: string;
                altPreview: string;
            };
            countdown: {
                fallback: string;
            };
            requirements: {
                header: {
                    title: string;
                    description: string;
                    secureNote: string;
                };
                sections: {
                    uploadTips: string;
                    dosDonts: string;
                };
                tips: {
                    blurredBackground: string;
                    naturalLight: string;
                    photos: string;
                    expression: string;
                    avoid: string;
                    clothing: string;
                    quantity: string;
                };
                dodonts: {
                    eyes: string;
                    lighting: string;
                    frame: string;
                    face: string;
                };
                altText: {
                    goodExample: string;
                    badExample: string;
                };
            };
            quality: {
                issues: {
                    image: {
                        lowResolution: string;
                        suboptimalResolution: string;
                        suboptimalResolutionLow: string;
                        tooDark: string;
                        tooBright: string;
                    };
                    face: {
                        none: string;
                        multiple: string;
                        positionNotOptimal: string;
                        detectSkipped: string;
                        angleExtreme: string;
                        sunglasses: string;
                        "sunglasses.critical": string;
                        eyesClosed: string;
                        tooSmall: string;
                        tooSmallToDetect: string;
                        tooLarge: string;
                        sizeNotOptimal: string;
                    };
                    contrast: {
                        separation: {
                            nearlyIdentical: string;
                            tooSimilar: string;
                            couldBeMoreDistinct: string;
                        };
                        poorOrFlat: string;
                    };
                    sharpness: {
                        tooBlurry: string;
                        pixelated: string;
                        suboptimal: string;
                    };
                    background: {
                        notBlurred: string;
                    };
                    upload: {
                        none: string;
                    };
                    body: {
                        minRequired: string;
                        tooMany: string;
                    };
                    score: {
                        tooLow: string;
                    };
                    eyes: {
                        maybeNotVisible: string;
                    };
                    reject: {
                        genericHint: string;
                    };
                };
            };
            uploader: {
                dragDropMessage: string;
                dragDropMoreMessage_one: string;
                dragDropMoreMessage_other: string;
                browse: string;
                supportedFormats: string;
                dropMessage: string;
                maxImagesReached: string;
            };
            status: {
                analyzing: string;
                checkingQuality: string;
            };
        };
        about: {
            mission: {
                line1: string;
            };
            paragraphs: string[];
            labels: {
                cofounders: string;
            };
        };
        legal: {
            common: {
                effectiveDate: string;
                endMarker: string;
                contact: string;
                email: string;
            };
            terms: {
                title: string;
                intro: string;
                sections: {
                    definitions: {
                        title: string;
                        items: {
                            service: string;
                            user: string;
                            userContent: string;
                            aiGenerated: string;
                            credits: string;
                        };
                    };
                    eligibility: {
                        title: string;
                        content: string;
                    };
                    userAccounts: {
                        title: string;
                        items: string[];
                    };
                    payments: {
                        title: string;
                        content: string;
                        refundsTitle: string;
                        refunds: string;
                        priceChangesTitle: string;
                        priceChanges: string;
                    };
                    ownership: {
                        title: string;
                        content: string;
                    };
                    prohibitedContent: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    aiGenerated: {
                        title: string;
                        content: string;
                    };
                    privacy: {
                        title: string;
                        content: string;
                    };
                    ip: {
                        title: string;
                        content: string;
                    };
                    liability: {
                        title: string;
                        content: string;
                    };
                    indemnity: {
                        title: string;
                        content: string;
                    };
                    termination: {
                        title: string;
                        content: string;
                    };
                    law: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    misc: {
                        title: string;
                        items: {
                            severability: string;
                            entireAgreement: string;
                            contact: string;
                        };
                    };
                };
            };
            privacy: {
                title: string;
                intro: string;
                sections: {
                    collect: {
                        title: string;
                        items: {
                            account: string;
                            userContent: string;
                            device: string;
                        };
                        note: string;
                    };
                    use: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    thirdParty: {
                        title: string;
                        items: {
                            aws: string;
                            stripe: string;
                        };
                        note: string;
                    };
                    cookies: {
                        title: string;
                        content: string;
                    };
                    retention: {
                        title: string;
                        content: string;
                    };
                    security: {
                        title: string;
                        intro: string;
                        items: string[];
                    };
                    rights: {
                        title: string;
                        intro: string;
                        items: string[];
                        contact: string;
                    };
                    children: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    contact: {
                        title: string;
                        content: string;
                    };
                };
            };
        };
        upload: {
            title: string;
            description: string;
            requirements: {
                title: string;
                description: string;
            };
            buttons: {
                upload: string;
                continue: string;
                retry: string;
            };
            errors: {
                invalidFile: string;
                fileTooLarge: string;
                uploadFailed: string;
                invalidFileType: string;
                fileSizeExceeded: string;
                duplicateFile: string;
                uploadFailedCount_one: string;
                uploadFailedCount_other: string;
            };
            progress: {
                uploading: string;
                processing: string;
                complete: string;
            };
            quality: {
                rejected: {
                    title: string;
                };
            };
        };
        homepage: {
            hero: {
                headline: string;
                tagline: string;
                subtitle: string;
            };
            story: {
                paragraph1: string;
                paragraph2: string;
                callToAction: string;
            };
            aria: {
                photoMetadata: string;
            };
            waitlist: {
                placeholder: string;
                ariaLabel: string;
                submitLabel: string;
                submittingLabel: string;
                validation: {
                    invalidEmail: string;
                };
                messages: {
                    alreadyOnWaitlist: string;
                    success: string;
                    defaultError: string;
                };
            };
        };
        account: {
            dialog: {
                title: string;
                selectSection: string;
            };
            navigation: {
                profile: string;
                subscription: string;
                settings: string;
                support: string;
            };
            buttons: {
                cancel: string;
                save: string;
                saving: string;
                signOut: string;
                subscribe: string;
                opening: string;
                manage: string;
                renew: string;
                buyCredits: string;
                deleteAccount: string;
            };
            profile: {
                title: string;
                firstName: string;
                lastName: string;
                email: string;
            };
            subscription: {
                title: string;
                loading: string;
                noPlan: string;
                planSuffix: string;
                cancelled: string;
                expires: string;
                renews: string;
                creditBalance: string;
                resets: string;
            };
            settings: {
                title: string;
                language: string;
                deleteAccount: {
                    title: string;
                    description: string;
                };
            };
            support: {
                title: string;
                description: string;
                faq: string;
                faqDescription: string;
                helpCenter: string;
                dmUs: string;
                emailUs: string;
            };
            errors: {
                failedToSave: string;
            };
            accessibility: {
                avatar: string;
                plan: string;
            };
        };
    };
    de: {
        common: {
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
                signIn: string;
            };
            navigation: {
                addStyles: string;
                payment: string;
                uploadPhotos: string;
                generate: string;
                explore: string;
                create: string;
                admin: string;
            };
            userNav: {
                signOut: string;
                accountSettings: string;
            };
            footer: {
                about: string;
                terms: string;
                privacy: string;
                copyright: string;
            };
            duration: {
                year_one: string;
                year_other: string;
                month_one: string;
                month_other: string;
                day_one: string;
                day_other: string;
            };
            aria: {
                favourites: string;
                avatar: string;
                brandLogo: string;
            };
            credits: {
                remaining_one: string;
                remaining_other: string;
            };
            contexts: {
                dialogService: {
                    defaultTitle: string;
                    defaultDescription: string;
                    notReadyWarning: string;
                };
                errors: {
                    missingProvider: {
                        styleSelection: string;
                        dialogService: string;
                        inferenceQueue: string;
                        carousel: string;
                        realtime: string;
                    };
                };
            };
        };
        auth: {
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
                emailInput: {
                    placeholder: string;
                    sendButton: string;
                    sendingButton: string;
                };
                social: {
                    button: string;
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
        pricing: {
            buyCredits: {
                title: string;
                description: string;
            };
            upgradePlan: {
                title: string;
                description: string;
            };
            purchase: {
                success: {
                    subscriptionTitle: string;
                    subscriptionTitleNew: string;
                    creditsTitle: string;
                    subscriptionDescriptionWithCredits: string;
                    subscriptionDescriptionWithCreditsNew: string;
                    subscriptionDescription: string;
                    subscriptionDescriptionNew: string;
                    creditsDescription: string;
                    returnToShoot: string;
                    defaultPlan: string;
                };
            };
            subscription: {
                context: {
                    characterLimit: {
                        title: string;
                        description: string;
                    };
                    qualityUpgrade: {
                        title: string;
                        description: string;
                    };
                    creditUpgrade: {
                        title: string;
                        description: string;
                    };
                    general: {
                        title: string;
                        description: string;
                    };
                    default: {
                        title: string;
                        description: string;
                    };
                };
                loading: string;
                empty: {
                    title: string;
                    description: string;
                };
                headers: {
                    chooseYourPlan: string;
                };
                banner: {
                    titleStart: string;
                    titleNumber: string;
                    description: {
                        start: string;
                        lifetime: string;
                        annualDiscount: string;
                        annualWord: string;
                        or: string;
                        monthlyDiscount: string;
                        monthlyWord: string;
                        end: string;
                    };
                    small: string;
                };
                toggle: {
                    monthly: string;
                    yearly: string;
                    aria: string;
                };
                card: {
                    recommended: string;
                    save: string;
                    perMonth: string;
                    billed: string;
                    creditsCount: string;
                    perMonthWord: string;
                    perCredit: string;
                    button: {
                        select: string;
                        current: string;
                        processing: string;
                        disabledTooltip: string;
                    };
                    features: {
                        quality: string;
                        characterIncluded: string;
                        maxCharacters: string;
                        concurrentShoots: string;
                        commercialUse: string;
                    };
                };
                footer: {
                    upgradeNotice: string;
                };
                toasts: {
                    loginRequired: string;
                    selectPlan: string;
                    invalidPlan: string;
                    openingPortal: string;
                    customerPortalFailed: string;
                    upgradePreviewFailed: string;
                    upgraded: string;
                    checkoutFailed: string;
                    invalidCheckout: string;
                };
            };
            credits: {
                dialog: {
                    headerSub: {
                        lowBalance: string;
                        creativity: string;
                    };
                    headerTitle: {
                        lowBalance: string;
                        fun: string;
                    };
                };
                card: {
                    images: string;
                    characters: string;
                    footnote: string;
                    button: {
                        buy: string;
                        processing: string;
                    };
                    validity: string;
                    oneTime: string;
                    perCredit: string;
                    perCreditWord: string;
                };
                toasts: {
                    loginRequired: string;
                    invalidPackConfig: string;
                    createCheckoutFailed: string;
                    purchaseFailed: string;
                };
            };
            comparisonTable: {
                categories: {
                    credits: string;
                    image: string;
                    characters: string;
                    generation: string;
                    support: string;
                };
                features: {
                    creditsPerMonth: string;
                    pricePerCredit: string;
                    resolution: string;
                    takesPerShoot: string;
                    portraitAspectRatio: string;
                    squareAspectRatio: string;
                    landscapeAspectRatio: string;
                    included: string;
                    storage: string;
                    concurrentShoots: string;
                    commercialUse: string;
                    priorityFeatures: string;
                    betaAccess: string;
                    emailSupport: string;
                    chatSupport: string;
                    dedicatedSupport: string;
                };
                values: {
                    upTo: string;
                };
            };
        };
        styles: {
            titles: {
                styleLabel: string;
                photoStyle: string;
                sceneLabel: string;
                wardrobeLabel: string;
                characterLabel: string;
                settingsLabel: string;
            };
            shoot: {
                subtitle: string;
            };
            character: {
                trainingQueued: string;
                trainingPending: string;
                trainingInitializing: string;
                remaining: string;
                photos: string;
                trainingFailedTitle: string;
                trainingFailedDesc: string;
            };
            qualities: {
                basic: string;
                medium: string;
                high: string;
            };
            labels: {
                credits: string;
                includedInPlan: string;
                limitReached: string;
                upgradePlanAddMore: string;
                upgradeOrBuyCredits: string;
                buyCredits: string;
                newStylesDropWeekly: string;
            };
            settings: {
                numberOfTakes: string;
                quality: string;
                aspectRatio: string;
            };
            status: {
                badge: {
                    pending: string;
                    queued: string;
                    initializing: string;
                    starting: string;
                    running: string;
                    generating: string;
                    completed: string;
                    failed: string;
                    connecting: string;
                };
                tooltip: {
                    pending: string;
                    queued: string;
                    queueReasons: {
                        character_not_ready: string;
                        concurrent_limit: string;
                        provider_temporary_issue: string;
                    };
                };
            };
        };
        generate: {
            buttons: {
                generate: string;
                create: string;
                done: string;
                cancel: string;
                confirm: string;
            };
            labels: {
                woman: string;
                man: string;
                scene: string;
                wardrobe: string;
                creditsSuffix: string;
                requiresActiveSubscription: string;
                calculating: string;
            };
            aria: {
                selectStyle: string;
                selectScene: string;
                selectWardrobe: string;
                selectCharacter: string;
                openSettings: string;
                trainingProgress: string;
                characterActions: string;
                closeOverlay: string;
                carouselNavigation: string;
                previous: string;
                next: string;
                search: string;
            };
            placeholders: {
                find: string;
            };
            admin: {
                title: string;
                enableNodeOverrides: string;
                overridesJson: string;
                enablePromptOverride: string;
                prompt: string;
                characterMetadata: string;
            };
            errors: {
                failedToStartGeneration: string;
                selectCharacterToGenerate: string;
            };
        };
        inference: {
            common: {
                pleaseTryAgain: string;
                cancel: string;
            };
            time: {
                justNow: string;
                minutesAgo: string;
                hoursAgo: string;
                daysAgo: string;
            };
            gallery: {
                error: string;
                retry: string;
                loadingMore: string;
                endOfList: string;
                howItWorksAria: string;
                steps: {
                    choose: {
                        title: string;
                        desc: string;
                    };
                    character: {
                        title: string;
                        desc: string;
                    };
                    generate: {
                        title: string;
                        desc: string;
                    };
                };
            };
            viewer: {
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                    cancel: string;
                };
                closeAria: string;
                carousel: {
                    aria: string;
                    prevAria: string;
                    nextAria: string;
                };
                overlay: {
                    displayOriginal: string;
                    displayOriginalAria: string;
                    originalUnavailableTitle: string;
                    originalUnavailableDesc: string;
                };
                viewOriginal: {
                    label: string;
                    viewing: string;
                    aria: string;
                    viewingAria: string;
                };
                title: string;
                imageIndex: string;
                favourite: {
                    ariaButton: string;
                    add: string;
                    remove: string;
                    updateErrorTitle: string;
                };
                metadata: {
                    labels: {
                        aspectRatio: string;
                        quality: string;
                        model: string;
                        character: string;
                    };
                    aspectLabels: {
                        square: string;
                        landscape: string;
                        portrait: string;
                    };
                };
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                alt: {
                    generated: string;
                    thumbnail: string;
                };
            };
            group: {
                status: {
                    failed: string;
                };
                error: {
                    generic: string;
                    timeout: string;
                    serverBusy: string;
                    memory: string;
                    connection: string;
                    imageGeneration: string;
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
                deleteFailedTitle: string;
                rerun: {
                    cannot: string;
                    missingInfo: string;
                    failed: string;
                };
                header: {
                    shootTitle: string;
                };
                tooltips: {
                    deleteShoot: string;
                    rerunShoot: string;
                };
                aria: {
                    thumbnailsPreview: string;
                    viewAllImages: string;
                };
                alt: {
                    preview: string;
                };
                buttons: {
                    viewAll: string;
                };
            };
            thumbnail: {
                alt: {
                    generatingPreview: string;
                    generated: string;
                };
                favourite: {
                    add: string;
                    remove: string;
                };
                loadingTitle: string;
                loadingDesc: string;
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
            };
        };
        character: {
            nameLabel: string;
            creditsRequired: string;
            training: string;
            trainingInitializing: string;
            trainingInitializingInfo: string;
            trainingQueued: string;
            trainingQueuedInfo: string;
            trainingWarmingUp: string;
            trainingWarmingUpInfo: string;
            trainingPending: string;
            trainingPendingInfo: string;
            trainingRunning: string;
            trainingRunningNoCountdown: string;
            trainingRunningInfo: string;
            returnToApp: string;
            trainingError: string;
            trainingFailed: string;
            trainingFailedDescription: string;
            confirmClose: {
                title: string;
                description: string;
                progressMessages: {
                    upload: string;
                    profile: string;
                    name: string;
                };
                buttons: {
                    cancel: string;
                    confirm: string;
                };
            };
            errors: {
                trainingRetryFailed: string;
                retryError: string;
            };
            upload: {
                uploadingFiles: string;
                uploadingInfo: string;
            };
            dialogTitles: {
                onboardingIntro: string;
                onboardingGuidelines: string;
                onboardingConfirmation: string;
                upload: string;
                name: string;
                uploading: string;
                training: string;
            };
            dialogDescription: {
                upload: string;
                name: string;
                training: string;
                default: string;
            };
            beforeUnloadWarning: string;
            onboarding: {
                intro: {
                    title: string;
                    description1: string;
                    description2: string;
                    privacy: string;
                    buttonGetStarted: string;
                    buttonSkip: string;
                };
                confirmation: {
                    title: string;
                    paragraph1: string;
                    paragraph2: string;
                    buttonStart: string;
                };
                guidelines: {
                    naturalLight: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    angles: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    expressions: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    variety: {
                        title: string;
                        description: string;
                        description2: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                };
                buttons: {
                    next: string;
                };
                floatingAlt: string;
            };
            uploadStep: {
                petMode: string;
                bodyShotRequirementsNotMet: string;
            };
            nameStep: {
                noPreview: string;
                create: string;
                altPreview: string;
            };
            countdown: {
                fallback: string;
            };
            requirements: {
                header: {
                    title: string;
                    description: string;
                    secureNote: string;
                };
                sections: {
                    uploadTips: string;
                    dosDonts: string;
                };
                tips: {
                    blurredBackground: string;
                    naturalLight: string;
                    photos: string;
                    expression: string;
                    avoid: string;
                    clothing: string;
                    quantity: string;
                };
                dodonts: {
                    eyes: string;
                    lighting: string;
                    frame: string;
                    face: string;
                };
                altText: {
                    goodExample: string;
                    badExample: string;
                };
            };
            quality: {
                issues: {
                    image: {
                        lowResolution: string;
                        suboptimalResolution: string;
                        suboptimalResolutionLow: string;
                        tooDark: string;
                        tooBright: string;
                    };
                    face: {
                        none: string;
                        multiple: string;
                        positionNotOptimal: string;
                        detectSkipped: string;
                        angleExtreme: string;
                        sunglasses: string;
                        "sunglasses.critical": string;
                        eyesClosed: string;
                        tooSmall: string;
                        tooSmallToDetect: string;
                        tooLarge: string;
                        sizeNotOptimal: string;
                    };
                    contrast: {
                        separation: {
                            nearlyIdentical: string;
                            tooSimilar: string;
                            couldBeMoreDistinct: string;
                        };
                        poorOrFlat: string;
                    };
                    sharpness: {
                        tooBlurry: string;
                        pixelated: string;
                        suboptimal: string;
                    };
                    background: {
                        notBlurred: string;
                    };
                    upload: {
                        none: string;
                    };
                    body: {
                        minRequired: string;
                        tooMany: string;
                    };
                    score: {
                        tooLow: string;
                    };
                    eyes: {
                        maybeNotVisible: string;
                    };
                    reject: {
                        genericHint: string;
                    };
                };
            };
            uploader: {
                dragDropMessage: string;
                dragDropMoreMessage_one: string;
                dragDropMoreMessage_other: string;
                browse: string;
                supportedFormats: string;
                dropMessage: string;
                maxImagesReached: string;
            };
            status: {
                analyzing: string;
                checkingQuality: string;
            };
        };
        about: {
            mission: {
                line1: string;
            };
            paragraphs: string[];
            labels: {
                cofounders: string;
            };
        };
        legal: {
            common: {
                effectiveDate: string;
                endMarker: string;
                contact: string;
                email: string;
            };
            terms: {
                title: string;
                intro: string;
                sections: {
                    definitions: {
                        title: string;
                        items: {
                            service: string;
                            user: string;
                            userContent: string;
                            aiGenerated: string;
                            credits: string;
                        };
                    };
                    eligibility: {
                        title: string;
                        content: string;
                    };
                    userAccounts: {
                        title: string;
                        items: string[];
                    };
                    payments: {
                        title: string;
                        content: string;
                        refundsTitle: string;
                        refunds: string;
                        priceChangesTitle: string;
                        priceChanges: string;
                    };
                    ownership: {
                        title: string;
                        content: string;
                    };
                    prohibitedContent: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    aiGenerated: {
                        title: string;
                        content: string;
                    };
                    privacy: {
                        title: string;
                        content: string;
                    };
                    ip: {
                        title: string;
                        content: string;
                    };
                    liability: {
                        title: string;
                        content: string;
                    };
                    indemnity: {
                        title: string;
                        content: string;
                    };
                    termination: {
                        title: string;
                        content: string;
                    };
                    law: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    misc: {
                        title: string;
                        items: {
                            severability: string;
                            entireAgreement: string;
                            contact: string;
                        };
                    };
                };
            };
            privacy: {
                title: string;
                intro: string;
                sections: {
                    collect: {
                        title: string;
                        items: {
                            account: string;
                            userContent: string;
                            device: string;
                        };
                        note: string;
                    };
                    use: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    thirdParty: {
                        title: string;
                        items: {
                            aws: string;
                            stripe: string;
                        };
                        note: string;
                    };
                    cookies: {
                        title: string;
                        content: string;
                    };
                    retention: {
                        title: string;
                        content: string;
                    };
                    security: {
                        title: string;
                        intro: string;
                        items: string[];
                    };
                    rights: {
                        title: string;
                        intro: string;
                        items: string[];
                        contact: string;
                    };
                    children: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    contact: {
                        title: string;
                        content: string;
                    };
                };
            };
        };
        upload: {
            title: string;
            description: string;
            requirements: {
                title: string;
                description: string;
            };
            buttons: {
                upload: string;
                continue: string;
                retry: string;
            };
            errors: {
                invalidFile: string;
                fileTooLarge: string;
                uploadFailed: string;
                invalidFileType: string;
                fileSizeExceeded: string;
                duplicateFile: string;
                uploadFailedCount_one: string;
                uploadFailedCount_other: string;
            };
            progress: {
                uploading: string;
                processing: string;
                complete: string;
            };
            quality: {
                rejected: {
                    title: string;
                };
            };
        };
        homepage: {
            hero: {
                headline: string;
                tagline: string;
                subtitle: string;
            };
            story: {
                paragraph1: string;
                paragraph2: string;
                callToAction: string;
            };
            aria: {
                photoMetadata: string;
            };
            waitlist: {
                placeholder: string;
                ariaLabel: string;
                submitLabel: string;
                submittingLabel: string;
                validation: {
                    invalidEmail: string;
                };
                messages: {
                    alreadyOnWaitlist: string;
                    success: string;
                    defaultError: string;
                };
            };
        };
        account: {
            dialog: {
                title: string;
                selectSection: string;
            };
            navigation: {
                profile: string;
                subscription: string;
                settings: string;
                support: string;
            };
            buttons: {
                cancel: string;
                save: string;
                saving: string;
                signOut: string;
                subscribe: string;
                opening: string;
                manage: string;
                renew: string;
                buyCredits: string;
                deleteAccount: string;
            };
            profile: {
                title: string;
                firstName: string;
                lastName: string;
                email: string;
            };
            subscription: {
                title: string;
                loading: string;
                noPlan: string;
                planSuffix: string;
                cancelled: string;
                expires: string;
                renews: string;
                creditBalance: string;
                resets: string;
            };
            settings: {
                title: string;
                language: string;
                deleteAccount: {
                    title: string;
                    description: string;
                };
            };
            support: {
                title: string;
                description: string;
                faq: string;
                faqDescription: string;
                helpCenter: string;
                dmUs: string;
                emailUs: string;
            };
            errors: {
                failedToSave: string;
            };
            accessibility: {
                avatar: string;
                plan: string;
            };
        };
    };
    nl: {
        common: {
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
                signIn: string;
            };
            navigation: {
                addStyles: string;
                payment: string;
                uploadPhotos: string;
                generate: string;
                explore: string;
                create: string;
                admin: string;
            };
            userNav: {
                signOut: string;
                accountSettings: string;
            };
            footer: {
                about: string;
                terms: string;
                privacy: string;
                copyright: string;
            };
            duration: {
                year_one: string;
                year_other: string;
                month_one: string;
                month_other: string;
                day_one: string;
                day_other: string;
            };
            aria: {
                favourites: string;
                avatar: string;
                brandLogo: string;
            };
            credits: {
                remaining_one: string;
                remaining_other: string;
            };
            contexts: {
                dialogService: {
                    defaultTitle: string;
                    defaultDescription: string;
                    notReadyWarning: string;
                };
                errors: {
                    missingProvider: {
                        styleSelection: string;
                        dialogService: string;
                        inferenceQueue: string;
                        carousel: string;
                        realtime: string;
                    };
                };
            };
        };
        auth: {
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
                emailInput: {
                    placeholder: string;
                    sendButton: string;
                    sendingButton: string;
                };
                social: {
                    button: string;
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
        pricing: {
            buyCredits: {
                title: string;
                description: string;
            };
            upgradePlan: {
                title: string;
                description: string;
            };
            purchase: {
                success: {
                    subscriptionTitle: string;
                    subscriptionTitleNew: string;
                    creditsTitle: string;
                    subscriptionDescriptionWithCredits: string;
                    subscriptionDescriptionWithCreditsNew: string;
                    subscriptionDescription: string;
                    subscriptionDescriptionNew: string;
                    creditsDescription: string;
                    returnToShoot: string;
                    defaultPlan: string;
                };
            };
            subscription: {
                context: {
                    characterLimit: {
                        title: string;
                        description: string;
                    };
                    qualityUpgrade: {
                        title: string;
                        description: string;
                    };
                    creditUpgrade: {
                        title: string;
                        description: string;
                    };
                    general: {
                        title: string;
                        description: string;
                    };
                    default: {
                        title: string;
                        description: string;
                    };
                };
                loading: string;
                empty: {
                    title: string;
                    description: string;
                };
                headers: {
                    chooseYourPlan: string;
                };
                banner: {
                    titleStart: string;
                    titleNumber: string;
                    description: {
                        start: string;
                        lifetime: string;
                        annualDiscount: string;
                        annualWord: string;
                        or: string;
                        monthlyDiscount: string;
                        monthlyWord: string;
                        end: string;
                    };
                    small: string;
                };
                toggle: {
                    monthly: string;
                    yearly: string;
                    aria: string;
                };
                card: {
                    recommended: string;
                    save: string;
                    perMonth: string;
                    billed: string;
                    creditsCount: string;
                    perMonthWord: string;
                    perCredit: string;
                    button: {
                        select: string;
                        current: string;
                        processing: string;
                        disabledTooltip: string;
                    };
                    features: {
                        quality: string;
                        characterIncluded: string;
                        maxCharacters: string;
                        concurrentShoots: string;
                        commercialUse: string;
                    };
                };
                footer: {
                    upgradeNotice: string;
                };
                toasts: {
                    loginRequired: string;
                    selectPlan: string;
                    invalidPlan: string;
                    openingPortal: string;
                    customerPortalFailed: string;
                    upgradePreviewFailed: string;
                    upgraded: string;
                    checkoutFailed: string;
                    invalidCheckout: string;
                };
            };
            credits: {
                dialog: {
                    headerSub: {
                        lowBalance: string;
                        creativity: string;
                    };
                    headerTitle: {
                        lowBalance: string;
                        fun: string;
                    };
                };
                card: {
                    images: string;
                    characters: string;
                    footnote: string;
                    button: {
                        buy: string;
                        processing: string;
                    };
                    validity: string;
                    oneTime: string;
                    perCredit: string;
                    perCreditWord: string;
                };
                toasts: {
                    loginRequired: string;
                    invalidPackConfig: string;
                    createCheckoutFailed: string;
                    purchaseFailed: string;
                };
            };
            comparisonTable: {
                categories: {
                    credits: string;
                    image: string;
                    characters: string;
                    generation: string;
                    support: string;
                };
                features: {
                    creditsPerMonth: string;
                    pricePerCredit: string;
                    resolution: string;
                    takesPerShoot: string;
                    portraitAspectRatio: string;
                    squareAspectRatio: string;
                    landscapeAspectRatio: string;
                    included: string;
                    storage: string;
                    concurrentShoots: string;
                    commercialUse: string;
                    priorityFeatures: string;
                    betaAccess: string;
                    emailSupport: string;
                    chatSupport: string;
                    dedicatedSupport: string;
                };
                values: {
                    upTo: string;
                };
            };
        };
        styles: {
            titles: {
                styleLabel: string;
                photoStyle: string;
                sceneLabel: string;
                wardrobeLabel: string;
                characterLabel: string;
                settingsLabel: string;
            };
            shoot: {
                subtitle: string;
            };
            character: {
                trainingQueued: string;
                trainingPending: string;
                trainingInitializing: string;
                remaining: string;
                photos: string;
                trainingFailedTitle: string;
                trainingFailedDesc: string;
            };
            qualities: {
                basic: string;
                medium: string;
                high: string;
            };
            labels: {
                credits: string;
                includedInPlan: string;
                limitReached: string;
                upgradePlanAddMore: string;
                upgradeOrBuyCredits: string;
                buyCredits: string;
                newStylesDropWeekly: string;
            };
            settings: {
                numberOfTakes: string;
                quality: string;
                aspectRatio: string;
            };
            status: {
                badge: {
                    pending: string;
                    queued: string;
                    initializing: string;
                    starting: string;
                    running: string;
                    generating: string;
                    completed: string;
                    failed: string;
                    connecting: string;
                };
                tooltip: {
                    pending: string;
                    queued: string;
                    queueReasons: {
                        character_not_ready: string;
                        concurrent_limit: string;
                        provider_temporary_issue: string;
                    };
                };
            };
        };
        generate: {
            buttons: {
                generate: string;
                create: string;
                done: string;
                cancel: string;
                confirm: string;
            };
            labels: {
                woman: string;
                man: string;
                scene: string;
                wardrobe: string;
                creditsSuffix: string;
                requiresActiveSubscription: string;
                calculating: string;
            };
            aria: {
                selectStyle: string;
                selectScene: string;
                selectWardrobe: string;
                selectCharacter: string;
                openSettings: string;
                trainingProgress: string;
                characterActions: string;
                closeOverlay: string;
                carouselNavigation: string;
                previous: string;
                next: string;
                search: string;
            };
            placeholders: {
                find: string;
            };
            admin: {
                title: string;
                enableNodeOverrides: string;
                overridesJson: string;
                enablePromptOverride: string;
                prompt: string;
                characterMetadata: string;
            };
            errors: {
                failedToStartGeneration: string;
                selectCharacterToGenerate: string;
            };
        };
        inference: {
            common: {
                pleaseTryAgain: string;
                cancel: string;
            };
            time: {
                justNow: string;
                minutesAgo: string;
                hoursAgo: string;
                daysAgo: string;
            };
            gallery: {
                error: string;
                retry: string;
                loadingMore: string;
                endOfList: string;
                howItWorksAria: string;
                steps: {
                    choose: {
                        title: string;
                        desc: string;
                    };
                    character: {
                        title: string;
                        desc: string;
                    };
                    generate: {
                        title: string;
                        desc: string;
                    };
                };
            };
            viewer: {
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                    cancel: string;
                };
                closeAria: string;
                carousel: {
                    aria: string;
                    prevAria: string;
                    nextAria: string;
                };
                overlay: {
                    displayOriginal: string;
                    displayOriginalAria: string;
                    originalUnavailableTitle: string;
                    originalUnavailableDesc: string;
                };
                viewOriginal: {
                    label: string;
                    viewing: string;
                    aria: string;
                    viewingAria: string;
                };
                title: string;
                imageIndex: string;
                favourite: {
                    ariaButton: string;
                    add: string;
                    remove: string;
                    updateErrorTitle: string;
                };
                metadata: {
                    labels: {
                        aspectRatio: string;
                        quality: string;
                        model: string;
                        character: string;
                    };
                    aspectLabels: {
                        square: string;
                        landscape: string;
                        portrait: string;
                    };
                };
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                alt: {
                    generated: string;
                    thumbnail: string;
                };
            };
            group: {
                status: {
                    failed: string;
                };
                error: {
                    generic: string;
                    timeout: string;
                    serverBusy: string;
                    memory: string;
                    connection: string;
                    imageGeneration: string;
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
                deleteFailedTitle: string;
                rerun: {
                    cannot: string;
                    missingInfo: string;
                    failed: string;
                };
                header: {
                    shootTitle: string;
                };
                tooltips: {
                    deleteShoot: string;
                    rerunShoot: string;
                };
                aria: {
                    thumbnailsPreview: string;
                    viewAllImages: string;
                };
                alt: {
                    preview: string;
                };
                buttons: {
                    viewAll: string;
                };
            };
            thumbnail: {
                alt: {
                    generatingPreview: string;
                    generated: string;
                };
                favourite: {
                    add: string;
                    remove: string;
                };
                loadingTitle: string;
                loadingDesc: string;
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
            };
        };
        character: {
            nameLabel: string;
            creditsRequired: string;
            training: string;
            trainingInitializing: string;
            trainingInitializingInfo: string;
            trainingQueued: string;
            trainingQueuedInfo: string;
            trainingWarmingUp: string;
            trainingWarmingUpInfo: string;
            trainingPending: string;
            trainingPendingInfo: string;
            trainingRunning: string;
            trainingRunningNoCountdown: string;
            trainingRunningInfo: string;
            returnToApp: string;
            trainingError: string;
            trainingFailed: string;
            trainingFailedDescription: string;
            confirmClose: {
                title: string;
                description: string;
                progressMessages: {
                    upload: string;
                    profile: string;
                    name: string;
                };
                buttons: {
                    cancel: string;
                    confirm: string;
                };
            };
            errors: {
                trainingRetryFailed: string;
                retryError: string;
            };
            upload: {
                uploadingFiles: string;
                uploadingInfo: string;
            };
            dialogTitles: {
                onboardingIntro: string;
                onboardingGuidelines: string;
                onboardingConfirmation: string;
                upload: string;
                name: string;
                uploading: string;
                training: string;
            };
            dialogDescription: {
                upload: string;
                name: string;
                training: string;
                default: string;
            };
            beforeUnloadWarning: string;
            onboarding: {
                intro: {
                    title: string;
                    description1: string;
                    description2: string;
                    privacy: string;
                    buttonGetStarted: string;
                    buttonSkip: string;
                };
                confirmation: {
                    title: string;
                    paragraph1: string;
                    paragraph2: string;
                    buttonStart: string;
                };
                guidelines: {
                    naturalLight: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    angles: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    expressions: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    variety: {
                        title: string;
                        description: string;
                        description2: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                };
                buttons: {
                    next: string;
                };
                floatingAlt: string;
            };
            uploadStep: {
                petMode: string;
                bodyShotRequirementsNotMet: string;
            };
            nameStep: {
                noPreview: string;
                create: string;
                altPreview: string;
            };
            countdown: {
                fallback: string;
            };
            requirements: {
                header: {
                    title: string;
                    description: string;
                    secureNote: string;
                };
                sections: {
                    uploadTips: string;
                    dosDonts: string;
                };
                tips: {
                    blurredBackground: string;
                    naturalLight: string;
                    photos: string;
                    expression: string;
                    avoid: string;
                    clothing: string;
                    quantity: string;
                };
                dodonts: {
                    eyes: string;
                    lighting: string;
                    frame: string;
                    face: string;
                };
                altText: {
                    goodExample: string;
                    badExample: string;
                };
            };
            quality: {
                issues: {
                    image: {
                        lowResolution: string;
                        suboptimalResolution: string;
                        suboptimalResolutionLow: string;
                        tooDark: string;
                        tooBright: string;
                    };
                    face: {
                        none: string;
                        multiple: string;
                        positionNotOptimal: string;
                        detectSkipped: string;
                        angleExtreme: string;
                        sunglasses: string;
                        "sunglasses.critical": string;
                        eyesClosed: string;
                        tooSmall: string;
                        tooSmallToDetect: string;
                        tooLarge: string;
                        sizeNotOptimal: string;
                    };
                    contrast: {
                        separation: {
                            nearlyIdentical: string;
                            tooSimilar: string;
                            couldBeMoreDistinct: string;
                        };
                        poorOrFlat: string;
                    };
                    sharpness: {
                        tooBlurry: string;
                        pixelated: string;
                        suboptimal: string;
                    };
                    background: {
                        notBlurred: string;
                    };
                    upload: {
                        none: string;
                    };
                    body: {
                        minRequired: string;
                        tooMany: string;
                    };
                    score: {
                        tooLow: string;
                    };
                    eyes: {
                        maybeNotVisible: string;
                    };
                    reject: {
                        genericHint: string;
                    };
                };
            };
            uploader: {
                dragDropMessage: string;
                dragDropMoreMessage_one: string;
                dragDropMoreMessage_other: string;
                browse: string;
                supportedFormats: string;
                dropMessage: string;
                maxImagesReached: string;
            };
            status: {
                analyzing: string;
                checkingQuality: string;
            };
        };
        about: {
            mission: {
                line1: string;
            };
            paragraphs: string[];
            labels: {
                cofounders: string;
            };
        };
        legal: {
            common: {
                effectiveDate: string;
                endMarker: string;
                contact: string;
                email: string;
            };
            terms: {
                title: string;
                intro: string;
                sections: {
                    definitions: {
                        title: string;
                        items: {
                            service: string;
                            user: string;
                            userContent: string;
                            aiGenerated: string;
                            credits: string;
                        };
                    };
                    eligibility: {
                        title: string;
                        content: string;
                    };
                    userAccounts: {
                        title: string;
                        items: string[];
                    };
                    payments: {
                        title: string;
                        content: string;
                        refundsTitle: string;
                        refunds: string;
                        priceChangesTitle: string;
                        priceChanges: string;
                    };
                    ownership: {
                        title: string;
                        content: string;
                    };
                    prohibitedContent: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    aiGenerated: {
                        title: string;
                        content: string;
                    };
                    privacy: {
                        title: string;
                        content: string;
                    };
                    ip: {
                        title: string;
                        content: string;
                    };
                    liability: {
                        title: string;
                        content: string;
                    };
                    indemnity: {
                        title: string;
                        content: string;
                    };
                    termination: {
                        title: string;
                        content: string;
                    };
                    law: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    misc: {
                        title: string;
                        items: {
                            severability: string;
                            entireAgreement: string;
                            contact: string;
                        };
                    };
                };
            };
            privacy: {
                title: string;
                intro: string;
                sections: {
                    collect: {
                        title: string;
                        items: {
                            account: string;
                            userContent: string;
                            device: string;
                        };
                        note: string;
                    };
                    use: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    thirdParty: {
                        title: string;
                        items: {
                            aws: string;
                            stripe: string;
                        };
                        note: string;
                    };
                    cookies: {
                        title: string;
                        content: string;
                    };
                    retention: {
                        title: string;
                        content: string;
                    };
                    security: {
                        title: string;
                        intro: string;
                        items: string[];
                    };
                    rights: {
                        title: string;
                        intro: string;
                        items: string[];
                        contact: string;
                    };
                    children: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    contact: {
                        title: string;
                        content: string;
                    };
                };
            };
        };
        upload: {
            title: string;
            description: string;
            requirements: {
                title: string;
                description: string;
            };
            buttons: {
                upload: string;
                continue: string;
                retry: string;
            };
            errors: {
                invalidFile: string;
                fileTooLarge: string;
                uploadFailed: string;
                invalidFileType: string;
                fileSizeExceeded: string;
                duplicateFile: string;
                uploadFailedCount_one: string;
                uploadFailedCount_other: string;
            };
            progress: {
                uploading: string;
                processing: string;
                complete: string;
            };
            quality: {
                rejected: {
                    title: string;
                };
            };
        };
        homepage: {
            hero: {
                headline: string;
                tagline: string;
                subtitle: string;
            };
            story: {
                paragraph1: string;
                paragraph2: string;
                callToAction: string;
            };
            aria: {
                photoMetadata: string;
            };
            waitlist: {
                placeholder: string;
                ariaLabel: string;
                submitLabel: string;
                submittingLabel: string;
                validation: {
                    invalidEmail: string;
                };
                messages: {
                    alreadyOnWaitlist: string;
                    success: string;
                    defaultError: string;
                };
            };
        };
        account: {
            dialog: {
                title: string;
                selectSection: string;
            };
            navigation: {
                profile: string;
                subscription: string;
                settings: string;
                support: string;
            };
            buttons: {
                cancel: string;
                save: string;
                saving: string;
                signOut: string;
                subscribe: string;
                opening: string;
                manage: string;
                renew: string;
                buyCredits: string;
                deleteAccount: string;
            };
            profile: {
                title: string;
                firstName: string;
                lastName: string;
                email: string;
            };
            subscription: {
                title: string;
                loading: string;
                noPlan: string;
                planSuffix: string;
                cancelled: string;
                expires: string;
                renews: string;
                creditBalance: string;
                resets: string;
            };
            settings: {
                title: string;
                language: string;
                deleteAccount: {
                    title: string;
                    description: string;
                };
            };
            support: {
                title: string;
                description: string;
                faq: string;
                faqDescription: string;
                helpCenter: string;
                dmUs: string;
                emailUs: string;
            };
            errors: {
                failedToSave: string;
            };
            accessibility: {
                avatar: string;
                plan: string;
            };
        };
    };
    cn: {
        common: {
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
                signIn: string;
            };
            navigation: {
                addStyles: string;
                payment: string;
                uploadPhotos: string;
                generate: string;
                explore: string;
                create: string;
                admin: string;
            };
            userNav: {
                signOut: string;
                accountSettings: string;
            };
            footer: {
                about: string;
                terms: string;
                privacy: string;
                copyright: string;
            };
            duration: {
                year_one: string;
                year_other: string;
                month_one: string;
                month_other: string;
                day_one: string;
                day_other: string;
            };
            aria: {
                favourites: string;
                avatar: string;
                brandLogo: string;
            };
            credits: {
                remaining_one: string;
                remaining_other: string;
            };
            contexts: {
                dialogService: {
                    defaultTitle: string;
                    defaultDescription: string;
                    notReadyWarning: string;
                };
                errors: {
                    missingProvider: {
                        styleSelection: string;
                        dialogService: string;
                        inferenceQueue: string;
                        carousel: string;
                        realtime: string;
                    };
                };
            };
        };
        auth: {
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
                emailInput: {
                    placeholder: string;
                    sendButton: string;
                    sendingButton: string;
                };
                social: {
                    button: string;
                    suffix: string;
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
        pricing: {
            buyCredits: {
                title: string;
                description: string;
            };
            upgradePlan: {
                title: string;
                description: string;
            };
            purchase: {
                success: {
                    subscriptionTitle: string;
                    subscriptionTitleNew: string;
                    creditsTitle: string;
                    subscriptionDescriptionWithCredits: string;
                    subscriptionDescriptionWithCreditsNew: string;
                    subscriptionDescription: string;
                    subscriptionDescriptionNew: string;
                    creditsDescription: string;
                    returnToShoot: string;
                    defaultPlan: string;
                };
            };
            subscription: {
                context: {
                    characterLimit: {
                        title: string;
                        description: string;
                    };
                    qualityUpgrade: {
                        title: string;
                        description: string;
                    };
                    creditUpgrade: {
                        title: string;
                        description: string;
                    };
                    general: {
                        title: string;
                        description: string;
                    };
                    default: {
                        title: string;
                        description: string;
                    };
                };
                loading: string;
                empty: {
                    title: string;
                    description: string;
                };
                headers: {
                    chooseYourPlan: string;
                };
                banner: {
                    titleStart: string;
                    titleNumber: string;
                    description: {
                        start: string;
                        lifetime: string;
                        annualDiscount: string;
                        annualWord: string;
                        or: string;
                        monthlyDiscount: string;
                        monthlyWord: string;
                        end: string;
                    };
                    small: string;
                };
                toggle: {
                    monthly: string;
                    yearly: string;
                    aria: string;
                };
                card: {
                    recommended: string;
                    save: string;
                    perMonth: string;
                    billed: string;
                    creditsCount: string;
                    perMonthWord: string;
                    perCredit: string;
                    button: {
                        select: string;
                        current: string;
                        processing: string;
                        disabledTooltip: string;
                    };
                    features: {
                        quality: string;
                        characterIncluded: string;
                        maxCharacters: string;
                        concurrentShoots: string;
                        commercialUse: string;
                    };
                };
                footer: {
                    upgradeNotice: string;
                };
                toasts: {
                    loginRequired: string;
                    selectPlan: string;
                    invalidPlan: string;
                    openingPortal: string;
                    customerPortalFailed: string;
                    upgradePreviewFailed: string;
                    upgraded: string;
                    checkoutFailed: string;
                    invalidCheckout: string;
                };
            };
            credits: {
                dialog: {
                    headerSub: {
                        lowBalance: string;
                        creativity: string;
                    };
                    headerTitle: {
                        lowBalance: string;
                        fun: string;
                    };
                };
                card: {
                    images: string;
                    characters: string;
                    footnote: string;
                    button: {
                        buy: string;
                        processing: string;
                    };
                    validity: string;
                    oneTime: string;
                    perCredit: string;
                    perCreditWord: string;
                };
                toasts: {
                    loginRequired: string;
                    invalidPackConfig: string;
                    createCheckoutFailed: string;
                    purchaseFailed: string;
                };
            };
            comparisonTable: {
                categories: {
                    credits: string;
                    image: string;
                    characters: string;
                    generation: string;
                    support: string;
                };
                features: {
                    creditsPerMonth: string;
                    pricePerCredit: string;
                    resolution: string;
                    takesPerShoot: string;
                    portraitAspectRatio: string;
                    squareAspectRatio: string;
                    landscapeAspectRatio: string;
                    included: string;
                    storage: string;
                    concurrentShoots: string;
                    commercialUse: string;
                    priorityFeatures: string;
                    betaAccess: string;
                    emailSupport: string;
                    chatSupport: string;
                    dedicatedSupport: string;
                };
                values: {
                    upTo: string;
                };
            };
        };
        styles: {
            titles: {
                styleLabel: string;
                photoStyle: string;
                sceneLabel: string;
                wardrobeLabel: string;
                characterLabel: string;
                settingsLabel: string;
            };
            shoot: {
                subtitle: string;
            };
            character: {
                trainingQueued: string;
                trainingPending: string;
                trainingInitializing: string;
                remaining: string;
                photos: string;
                trainingFailedTitle: string;
                trainingFailedDesc: string;
            };
            qualities: {
                basic: string;
                medium: string;
                high: string;
            };
            labels: {
                credits: string;
                includedInPlan: string;
                limitReached: string;
                upgradePlanAddMore: string;
                upgradeOrBuyCredits: string;
                buyCredits: string;
                newStylesDropWeekly: string;
            };
            settings: {
                numberOfTakes: string;
                quality: string;
                aspectRatio: string;
            };
            status: {
                badge: {
                    pending: string;
                    queued: string;
                    initializing: string;
                    starting: string;
                    running: string;
                    generating: string;
                    completed: string;
                    failed: string;
                    connecting: string;
                };
                tooltip: {
                    pending: string;
                    queued: string;
                    queueReasons: {
                        character_not_ready: string;
                        concurrent_limit: string;
                        provider_temporary_issue: string;
                    };
                };
            };
        };
        generate: {
            buttons: {
                generate: string;
                create: string;
                done: string;
                cancel: string;
                confirm: string;
            };
            labels: {
                woman: string;
                man: string;
                scene: string;
                wardrobe: string;
                creditsSuffix: string;
                requiresActiveSubscription: string;
                calculating: string;
            };
            aria: {
                selectStyle: string;
                selectScene: string;
                selectWardrobe: string;
                selectCharacter: string;
                openSettings: string;
                trainingProgress: string;
                characterActions: string;
                closeOverlay: string;
                carouselNavigation: string;
                previous: string;
                next: string;
                search: string;
            };
            placeholders: {
                find: string;
            };
            admin: {
                title: string;
                enableNodeOverrides: string;
                overridesJson: string;
                enablePromptOverride: string;
                prompt: string;
                characterMetadata: string;
            };
            errors: {
                failedToStartGeneration: string;
                selectCharacterToGenerate: string;
            };
        };
        inference: {
            common: {
                pleaseTryAgain: string;
                cancel: string;
            };
            time: {
                justNow: string;
                minutesAgo: string;
                hoursAgo: string;
                daysAgo: string;
            };
            gallery: {
                error: string;
                retry: string;
                loadingMore: string;
                endOfList: string;
                howItWorksAria: string;
                steps: {
                    choose: {
                        title: string;
                        desc: string;
                    };
                    character: {
                        title: string;
                        desc: string;
                    };
                    generate: {
                        title: string;
                        desc: string;
                    };
                };
            };
            viewer: {
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                    cancel: string;
                };
                closeAria: string;
                carousel: {
                    aria: string;
                    prevAria: string;
                    nextAria: string;
                };
                overlay: {
                    displayOriginal: string;
                    displayOriginalAria: string;
                    originalUnavailableTitle: string;
                    originalUnavailableDesc: string;
                };
                viewOriginal: {
                    label: string;
                    viewing: string;
                    aria: string;
                    viewingAria: string;
                };
                title: string;
                imageIndex: string;
                favourite: {
                    ariaButton: string;
                    add: string;
                    remove: string;
                    updateErrorTitle: string;
                };
                metadata: {
                    labels: {
                        aspectRatio: string;
                        quality: string;
                        model: string;
                        character: string;
                    };
                    aspectLabels: {
                        square: string;
                        landscape: string;
                        portrait: string;
                    };
                };
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                alt: {
                    generated: string;
                    thumbnail: string;
                };
            };
            group: {
                status: {
                    failed: string;
                };
                error: {
                    generic: string;
                    timeout: string;
                    serverBusy: string;
                    memory: string;
                    connection: string;
                    imageGeneration: string;
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
                deleteFailedTitle: string;
                rerun: {
                    cannot: string;
                    missingInfo: string;
                    failed: string;
                };
                header: {
                    shootTitle: string;
                };
                tooltips: {
                    deleteShoot: string;
                    rerunShoot: string;
                };
                aria: {
                    thumbnailsPreview: string;
                    viewAllImages: string;
                };
                alt: {
                    preview: string;
                };
                buttons: {
                    viewAll: string;
                };
            };
            thumbnail: {
                alt: {
                    generatingPreview: string;
                    generated: string;
                };
                favourite: {
                    add: string;
                    remove: string;
                };
                loadingTitle: string;
                loadingDesc: string;
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
            };
        };
        character: {
            nameLabel: string;
            creditsRequired: string;
            training: string;
            trainingInitializing: string;
            trainingInitializingInfo: string;
            trainingQueued: string;
            trainingQueuedInfo: string;
            trainingWarmingUp: string;
            trainingWarmingUpInfo: string;
            trainingPending: string;
            trainingPendingInfo: string;
            trainingRunning: string;
            trainingRunningNoCountdown: string;
            trainingRunningInfo: string;
            returnToApp: string;
            trainingError: string;
            trainingFailed: string;
            trainingFailedDescription: string;
            confirmClose: {
                title: string;
                description: string;
                progressMessages: {
                    upload: string;
                    profile: string;
                    name: string;
                };
                buttons: {
                    cancel: string;
                    confirm: string;
                };
            };
            errors: {
                trainingRetryFailed: string;
                retryError: string;
            };
            upload: {
                uploadingFiles: string;
                uploadingInfo: string;
            };
            dialogTitles: {
                onboardingIntro: string;
                onboardingGuidelines: string;
                onboardingConfirmation: string;
                upload: string;
                name: string;
                uploading: string;
                training: string;
            };
            dialogDescription: {
                upload: string;
                name: string;
                training: string;
                default: string;
            };
            beforeUnloadWarning: string;
            onboarding: {
                intro: {
                    title: string;
                    description1: string;
                    description2: string;
                    privacy: string;
                    buttonGetStarted: string;
                    buttonSkip: string;
                };
                confirmation: {
                    title: string;
                    paragraph1: string;
                    paragraph2: string;
                    buttonStart: string;
                };
                guidelines: {
                    naturalLight: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    angles: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    expressions: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    variety: {
                        title: string;
                        description: string;
                        description2: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                };
                buttons: {
                    next: string;
                };
                floatingAlt: string;
            };
            uploadStep: {
                petMode: string;
                bodyShotRequirementsNotMet: string;
            };
            nameStep: {
                noPreview: string;
                create: string;
                altPreview: string;
            };
            countdown: {
                fallback: string;
            };
            requirements: {
                header: {
                    title: string;
                    description: string;
                    secureNote: string;
                };
                sections: {
                    uploadTips: string;
                    dosDonts: string;
                };
                tips: {
                    blurredBackground: string;
                    naturalLight: string;
                    photos: string;
                    expression: string;
                    avoid: string;
                    clothing: string;
                    quantity: string;
                };
                dodonts: {
                    eyes: string;
                    lighting: string;
                    frame: string;
                    face: string;
                };
                altText: {
                    goodExample: string;
                    badExample: string;
                };
            };
            quality: {
                issues: {
                    image: {
                        lowResolution: string;
                        suboptimalResolution: string;
                        suboptimalResolutionLow: string;
                        tooDark: string;
                        tooBright: string;
                    };
                    face: {
                        none: string;
                        multiple: string;
                        positionNotOptimal: string;
                        detectSkipped: string;
                        angleExtreme: string;
                        sunglasses: string;
                        "sunglasses.critical": string;
                        eyesClosed: string;
                        tooSmall: string;
                        tooSmallToDetect: string;
                        tooLarge: string;
                        sizeNotOptimal: string;
                    };
                    contrast: {
                        separation: {
                            nearlyIdentical: string;
                            tooSimilar: string;
                            couldBeMoreDistinct: string;
                        };
                        poorOrFlat: string;
                    };
                    sharpness: {
                        tooBlurry: string;
                        pixelated: string;
                        suboptimal: string;
                    };
                    background: {
                        notBlurred: string;
                    };
                    upload: {
                        none: string;
                    };
                    body: {
                        minRequired: string;
                        tooMany: string;
                    };
                    score: {
                        tooLow: string;
                    };
                    eyes: {
                        maybeNotVisible: string;
                    };
                    reject: {
                        genericHint: string;
                    };
                };
            };
            uploader: {
                dragDropMessage: string;
                dragDropMoreMessage_one: string;
                dragDropMoreMessage_other: string;
                browse: string;
                supportedFormats: string;
                dropMessage: string;
                maxImagesReached: string;
            };
            status: {
                analyzing: string;
                checkingQuality: string;
            };
        };
        about: {
            mission: {
                line1: string;
            };
            paragraphs: string[];
            labels: {
                cofounders: string;
            };
        };
        legal: {
            common: {
                effectiveDate: string;
                endMarker: string;
                contact: string;
                email: string;
            };
            terms: {
                title: string;
                intro: string;
                sections: {
                    definitions: {
                        title: string;
                        items: {
                            service: string;
                            user: string;
                            userContent: string;
                            aiGenerated: string;
                            credits: string;
                        };
                    };
                    eligibility: {
                        title: string;
                        content: string;
                    };
                    userAccounts: {
                        title: string;
                        items: string[];
                    };
                    payments: {
                        title: string;
                        content: string;
                        refundsTitle: string;
                        refunds: string;
                        priceChangesTitle: string;
                        priceChanges: string;
                    };
                    ownership: {
                        title: string;
                        content: string;
                    };
                    prohibitedContent: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    aiGenerated: {
                        title: string;
                        content: string;
                    };
                    privacy: {
                        title: string;
                        content: string;
                    };
                    ip: {
                        title: string;
                        content: string;
                    };
                    liability: {
                        title: string;
                        content: string;
                    };
                    indemnity: {
                        title: string;
                        content: string;
                    };
                    termination: {
                        title: string;
                        content: string;
                    };
                    law: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    misc: {
                        title: string;
                        items: {
                            severability: string;
                            entireAgreement: string;
                            contact: string;
                        };
                    };
                };
            };
            privacy: {
                title: string;
                intro: string;
                sections: {
                    collect: {
                        title: string;
                        items: {
                            account: string;
                            userContent: string;
                            device: string;
                        };
                        note: string;
                    };
                    use: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    thirdParty: {
                        title: string;
                        items: {
                            aws: string;
                            stripe: string;
                        };
                        note: string;
                    };
                    cookies: {
                        title: string;
                        content: string;
                    };
                    retention: {
                        title: string;
                        content: string;
                    };
                    security: {
                        title: string;
                        intro: string;
                        items: string[];
                    };
                    rights: {
                        title: string;
                        intro: string;
                        items: string[];
                        contact: string;
                    };
                    children: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    contact: {
                        title: string;
                        content: string;
                    };
                };
            };
        };
        upload: {
            title: string;
            description: string;
            requirements: {
                title: string;
                description: string;
            };
            buttons: {
                upload: string;
                continue: string;
                retry: string;
            };
            errors: {
                invalidFile: string;
                fileTooLarge: string;
                uploadFailed: string;
                invalidFileType: string;
                fileSizeExceeded: string;
                duplicateFile: string;
                uploadFailedCount_other: string;
            };
            progress: {
                uploading: string;
                processing: string;
                complete: string;
            };
            quality: {
                rejected: {
                    title: string;
                };
            };
        };
        homepage: {
            hero: {
                headline: string;
                tagline: string;
                subtitle: string;
            };
            story: {
                paragraph1: string;
                paragraph2: string;
                callToAction: string;
            };
            aria: {
                photoMetadata: string;
            };
            waitlist: {
                placeholder: string;
                ariaLabel: string;
                submitLabel: string;
                submittingLabel: string;
                validation: {
                    invalidEmail: string;
                };
                messages: {
                    alreadyOnWaitlist: string;
                    success: string;
                    defaultError: string;
                };
            };
        };
        account: {
            dialog: {
                title: string;
                selectSection: string;
            };
            navigation: {
                profile: string;
                subscription: string;
                settings: string;
                support: string;
            };
            buttons: {
                cancel: string;
                save: string;
                saving: string;
                signOut: string;
                subscribe: string;
                opening: string;
                manage: string;
                renew: string;
                buyCredits: string;
                deleteAccount: string;
            };
            profile: {
                title: string;
                firstName: string;
                lastName: string;
                email: string;
            };
            subscription: {
                title: string;
                loading: string;
                noPlan: string;
                planSuffix: string;
                cancelled: string;
                expires: string;
                renews: string;
                creditBalance: string;
                resets: string;
            };
            settings: {
                title: string;
                language: string;
                deleteAccount: {
                    title: string;
                    description: string;
                };
            };
            support: {
                title: string;
                description: string;
                faq: string;
                faqDescription: string;
                helpCenter: string;
                dmUs: string;
                emailUs: string;
            };
            errors: {
                failedToSave: string;
            };
            accessibility: {
                avatar: string;
                plan: string;
            };
        };
    };
    jp: {
        common: {
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
                signIn: string;
            };
            navigation: {
                addStyles: string;
                payment: string;
                uploadPhotos: string;
                generate: string;
                explore: string;
                create: string;
                admin: string;
            };
            userNav: {
                signOut: string;
                accountSettings: string;
            };
            footer: {
                about: string;
                terms: string;
                privacy: string;
                copyright: string;
            };
            duration: {
                year_one: string;
                year_other: string;
                month_one: string;
                month_other: string;
                day_one: string;
                day_other: string;
            };
            aria: {
                favourites: string;
                avatar: string;
                brandLogo: string;
            };
            credits: {
                remaining_one: string;
                remaining_other: string;
            };
            contexts: {
                dialogService: {
                    defaultTitle: string;
                    defaultDescription: string;
                    notReadyWarning: string;
                };
                errors: {
                    missingProvider: {
                        styleSelection: string;
                        dialogService: string;
                        inferenceQueue: string;
                        carousel: string;
                        realtime: string;
                    };
                };
            };
        };
        auth: {
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
                emailInput: {
                    placeholder: string;
                    sendButton: string;
                    sendingButton: string;
                };
                social: {
                    button: string;
                    suffix: string;
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
        pricing: {
            buyCredits: {
                title: string;
                description: string;
            };
            upgradePlan: {
                title: string;
                description: string;
            };
            purchase: {
                success: {
                    subscriptionTitle: string;
                    subscriptionTitleNew: string;
                    creditsTitle: string;
                    subscriptionDescriptionWithCredits: string;
                    subscriptionDescriptionWithCreditsNew: string;
                    subscriptionDescription: string;
                    subscriptionDescriptionNew: string;
                    creditsDescription: string;
                    returnToShoot: string;
                    defaultPlan: string;
                };
            };
            subscription: {
                context: {
                    characterLimit: {
                        title: string;
                        description: string;
                    };
                    qualityUpgrade: {
                        title: string;
                        description: string;
                    };
                    creditUpgrade: {
                        title: string;
                        description: string;
                    };
                    general: {
                        title: string;
                        description: string;
                    };
                    default: {
                        title: string;
                        description: string;
                    };
                };
                loading: string;
                empty: {
                    title: string;
                    description: string;
                };
                headers: {
                    chooseYourPlan: string;
                };
                banner: {
                    titleStart: string;
                    titleNumber: string;
                    description: {
                        start: string;
                        lifetime: string;
                        annualDiscount: string;
                        annualWord: string;
                        or: string;
                        monthlyDiscount: string;
                        monthlyWord: string;
                        end: string;
                    };
                    small: string;
                };
                toggle: {
                    monthly: string;
                    yearly: string;
                    aria: string;
                };
                card: {
                    recommended: string;
                    save: string;
                    perMonth: string;
                    billed: string;
                    creditsCount: string;
                    perMonthWord: string;
                    perCredit: string;
                    button: {
                        select: string;
                        current: string;
                        processing: string;
                        disabledTooltip: string;
                    };
                    features: {
                        quality: string;
                        characterIncluded: string;
                        maxCharacters: string;
                        concurrentShoots: string;
                        commercialUse: string;
                    };
                };
                footer: {
                    upgradeNotice: string;
                };
                toasts: {
                    loginRequired: string;
                    selectPlan: string;
                    invalidPlan: string;
                    openingPortal: string;
                    customerPortalFailed: string;
                    upgradePreviewFailed: string;
                    upgraded: string;
                    checkoutFailed: string;
                    invalidCheckout: string;
                };
            };
            credits: {
                dialog: {
                    headerSub: {
                        lowBalance: string;
                        creativity: string;
                    };
                    headerTitle: {
                        lowBalance: string;
                        fun: string;
                    };
                };
                card: {
                    images: string;
                    characters: string;
                    footnote: string;
                    button: {
                        buy: string;
                        processing: string;
                    };
                    validity: string;
                    oneTime: string;
                    perCredit: string;
                    perCreditWord: string;
                };
                toasts: {
                    loginRequired: string;
                    invalidPackConfig: string;
                    createCheckoutFailed: string;
                    purchaseFailed: string;
                };
            };
            comparisonTable: {
                categories: {
                    credits: string;
                    image: string;
                    characters: string;
                    generation: string;
                    support: string;
                };
                features: {
                    creditsPerMonth: string;
                    pricePerCredit: string;
                    resolution: string;
                    takesPerShoot: string;
                    portraitAspectRatio: string;
                    squareAspectRatio: string;
                    landscapeAspectRatio: string;
                    included: string;
                    storage: string;
                    concurrentShoots: string;
                    commercialUse: string;
                    priorityFeatures: string;
                    betaAccess: string;
                    emailSupport: string;
                    chatSupport: string;
                    dedicatedSupport: string;
                };
                values: {
                    upTo: string;
                };
            };
        };
        styles: {
            titles: {
                styleLabel: string;
                photoStyle: string;
                sceneLabel: string;
                wardrobeLabel: string;
                characterLabel: string;
                settingsLabel: string;
            };
            shoot: {
                subtitle: string;
            };
            character: {
                trainingQueued: string;
                trainingPending: string;
                trainingInitializing: string;
                remaining: string;
                photos: string;
                trainingFailedTitle: string;
                trainingFailedDesc: string;
            };
            qualities: {
                basic: string;
                medium: string;
                high: string;
            };
            labels: {
                credits: string;
                includedInPlan: string;
                limitReached: string;
                upgradePlanAddMore: string;
                upgradeOrBuyCredits: string;
                buyCredits: string;
                newStylesDropWeekly: string;
            };
            settings: {
                numberOfTakes: string;
                quality: string;
                aspectRatio: string;
            };
            status: {
                badge: {
                    pending: string;
                    queued: string;
                    initializing: string;
                    starting: string;
                    running: string;
                    generating: string;
                    completed: string;
                    failed: string;
                    connecting: string;
                };
                tooltip: {
                    pending: string;
                    queued: string;
                    queueReasons: {
                        character_not_ready: string;
                        concurrent_limit: string;
                        provider_temporary_issue: string;
                    };
                };
            };
        };
        generate: {
            buttons: {
                generate: string;
                create: string;
                done: string;
                cancel: string;
                confirm: string;
            };
            labels: {
                woman: string;
                man: string;
                scene: string;
                wardrobe: string;
                creditsSuffix: string;
                requiresActiveSubscription: string;
                calculating: string;
            };
            aria: {
                selectStyle: string;
                selectScene: string;
                selectWardrobe: string;
                selectCharacter: string;
                openSettings: string;
                trainingProgress: string;
                characterActions: string;
                closeOverlay: string;
                carouselNavigation: string;
                previous: string;
                next: string;
                search: string;
            };
            placeholders: {
                find: string;
            };
            admin: {
                title: string;
                enableNodeOverrides: string;
                overridesJson: string;
                enablePromptOverride: string;
                prompt: string;
                characterMetadata: string;
            };
            errors: {
                failedToStartGeneration: string;
                selectCharacterToGenerate: string;
            };
        };
        inference: {
            common: {
                pleaseTryAgain: string;
                cancel: string;
            };
            time: {
                justNow: string;
                minutesAgo: string;
                hoursAgo: string;
                daysAgo: string;
            };
            gallery: {
                error: string;
                retry: string;
                loadingMore: string;
                endOfList: string;
                howItWorksAria: string;
                steps: {
                    choose: {
                        title: string;
                        desc: string;
                    };
                    character: {
                        title: string;
                        desc: string;
                    };
                    generate: {
                        title: string;
                        desc: string;
                    };
                };
            };
            viewer: {
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                    cancel: string;
                };
                closeAria: string;
                carousel: {
                    aria: string;
                    prevAria: string;
                    nextAria: string;
                };
                overlay: {
                    displayOriginal: string;
                    displayOriginalAria: string;
                    originalUnavailableTitle: string;
                    originalUnavailableDesc: string;
                };
                viewOriginal: {
                    label: string;
                    viewing: string;
                    aria: string;
                    viewingAria: string;
                };
                title: string;
                imageIndex: string;
                favourite: {
                    ariaButton: string;
                    add: string;
                    remove: string;
                    updateErrorTitle: string;
                };
                metadata: {
                    labels: {
                        aspectRatio: string;
                        quality: string;
                        model: string;
                        character: string;
                    };
                    aspectLabels: {
                        square: string;
                        landscape: string;
                        portrait: string;
                    };
                };
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                alt: {
                    generated: string;
                    thumbnail: string;
                };
            };
            group: {
                status: {
                    failed: string;
                };
                error: {
                    generic: string;
                    timeout: string;
                    serverBusy: string;
                    memory: string;
                    connection: string;
                    imageGeneration: string;
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
                deleteFailedTitle: string;
                rerun: {
                    cannot: string;
                    missingInfo: string;
                    failed: string;
                };
                header: {
                    shootTitle: string;
                };
                tooltips: {
                    deleteShoot: string;
                    rerunShoot: string;
                };
                aria: {
                    thumbnailsPreview: string;
                    viewAllImages: string;
                };
                alt: {
                    preview: string;
                };
                buttons: {
                    viewAll: string;
                };
            };
            thumbnail: {
                alt: {
                    generatingPreview: string;
                    generated: string;
                };
                favourite: {
                    add: string;
                    remove: string;
                };
                loadingTitle: string;
                loadingDesc: string;
                actions: {
                    delete: {
                        label: string;
                        aria: string;
                    };
                    download: {
                        label: string;
                        aria: string;
                    };
                };
                confirmDelete: {
                    title: string;
                    description: string;
                    confirm: string;
                };
            };
        };
        character: {
            nameLabel: string;
            creditsRequired: string;
            training: string;
            trainingInitializing: string;
            trainingInitializingInfo: string;
            trainingQueued: string;
            trainingQueuedInfo: string;
            trainingWarmingUp: string;
            trainingWarmingUpInfo: string;
            trainingPending: string;
            trainingPendingInfo: string;
            trainingRunning: string;
            trainingRunningNoCountdown: string;
            trainingRunningInfo: string;
            returnToApp: string;
            trainingError: string;
            trainingFailed: string;
            trainingFailedDescription: string;
            confirmClose: {
                title: string;
                description: string;
                progressMessages: {
                    upload: string;
                    profile: string;
                    name: string;
                };
                buttons: {
                    cancel: string;
                    confirm: string;
                };
            };
            errors: {
                trainingRetryFailed: string;
                retryError: string;
            };
            upload: {
                uploadingFiles: string;
                uploadingInfo: string;
            };
            dialogTitles: {
                onboardingIntro: string;
                onboardingGuidelines: string;
                onboardingConfirmation: string;
                upload: string;
                name: string;
                uploading: string;
                training: string;
            };
            dialogDescription: {
                upload: string;
                name: string;
                training: string;
                default: string;
            };
            beforeUnloadWarning: string;
            onboarding: {
                intro: {
                    title: string;
                    description1: string;
                    description2: string;
                    privacy: string;
                    buttonGetStarted: string;
                    buttonSkip: string;
                };
                confirmation: {
                    title: string;
                    paragraph1: string;
                    paragraph2: string;
                    buttonStart: string;
                };
                guidelines: {
                    naturalLight: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    angles: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    expressions: {
                        title: string;
                        description: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                    variety: {
                        title: string;
                        description: string;
                        description2: string;
                        goodAlt: string;
                        badAlt: string;
                    };
                };
                buttons: {
                    next: string;
                };
                floatingAlt: string;
            };
            uploadStep: {
                petMode: string;
                bodyShotRequirementsNotMet: string;
            };
            nameStep: {
                noPreview: string;
                create: string;
                altPreview: string;
            };
            countdown: {
                fallback: string;
            };
            requirements: {
                header: {
                    title: string;
                    description: string;
                    secureNote: string;
                };
                sections: {
                    uploadTips: string;
                    dosDonts: string;
                };
                tips: {
                    blurredBackground: string;
                    naturalLight: string;
                    photos: string;
                    expression: string;
                    avoid: string;
                    clothing: string;
                    quantity: string;
                };
                dodonts: {
                    eyes: string;
                    lighting: string;
                    frame: string;
                    face: string;
                };
                altText: {
                    goodExample: string;
                    badExample: string;
                };
            };
            quality: {
                issues: {
                    image: {
                        lowResolution: string;
                        suboptimalResolution: string;
                        suboptimalResolutionLow: string;
                        tooDark: string;
                        tooBright: string;
                    };
                    face: {
                        none: string;
                        multiple: string;
                        positionNotOptimal: string;
                        detectSkipped: string;
                        angleExtreme: string;
                        sunglasses: string;
                        "sunglasses.critical": string;
                        eyesClosed: string;
                        tooSmall: string;
                        tooSmallToDetect: string;
                        tooLarge: string;
                        sizeNotOptimal: string;
                    };
                    contrast: {
                        separation: {
                            nearlyIdentical: string;
                            tooSimilar: string;
                            couldBeMoreDistinct: string;
                        };
                        poorOrFlat: string;
                    };
                    sharpness: {
                        tooBlurry: string;
                        pixelated: string;
                        suboptimal: string;
                    };
                    background: {
                        notBlurred: string;
                    };
                    upload: {
                        none: string;
                    };
                    body: {
                        minRequired: string;
                        tooMany: string;
                    };
                    score: {
                        tooLow: string;
                    };
                    eyes: {
                        maybeNotVisible: string;
                    };
                    reject: {
                        genericHint: string;
                    };
                };
            };
            uploader: {
                dragDropMessage: string;
                dragDropMoreMessage_one: string;
                dragDropMoreMessage_other: string;
                browse: string;
                supportedFormats: string;
                dropMessage: string;
                maxImagesReached: string;
            };
            status: {
                analyzing: string;
                checkingQuality: string;
            };
        };
        about: {
            mission: {
                line1: string;
            };
            paragraphs: string[];
            labels: {
                cofounders: string;
            };
        };
        legal: {
            common: {
                effectiveDate: string;
                endMarker: string;
                contact: string;
                email: string;
            };
            terms: {
                title: string;
                intro: string;
                sections: {
                    definitions: {
                        title: string;
                        items: {
                            service: string;
                            user: string;
                            userContent: string;
                            aiGenerated: string;
                            credits: string;
                        };
                    };
                    eligibility: {
                        title: string;
                        content: string;
                    };
                    userAccounts: {
                        title: string;
                        items: string[];
                    };
                    payments: {
                        title: string;
                        content: string;
                        refundsTitle: string;
                        refunds: string;
                        priceChangesTitle: string;
                        priceChanges: string;
                    };
                    ownership: {
                        title: string;
                        content: string;
                    };
                    prohibitedContent: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    aiGenerated: {
                        title: string;
                        content: string;
                    };
                    privacy: {
                        title: string;
                        content: string;
                    };
                    ip: {
                        title: string;
                        content: string;
                    };
                    liability: {
                        title: string;
                        content: string;
                    };
                    indemnity: {
                        title: string;
                        content: string;
                    };
                    termination: {
                        title: string;
                        content: string;
                    };
                    law: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    misc: {
                        title: string;
                        items: {
                            severability: string;
                            entireAgreement: string;
                            contact: string;
                        };
                    };
                };
            };
            privacy: {
                title: string;
                intro: string;
                sections: {
                    collect: {
                        title: string;
                        items: {
                            account: string;
                            userContent: string;
                            device: string;
                        };
                        note: string;
                    };
                    use: {
                        title: string;
                        intro: string;
                        items: string[];
                        note: string;
                    };
                    thirdParty: {
                        title: string;
                        items: {
                            aws: string;
                            stripe: string;
                        };
                        note: string;
                    };
                    cookies: {
                        title: string;
                        content: string;
                    };
                    retention: {
                        title: string;
                        content: string;
                    };
                    security: {
                        title: string;
                        intro: string;
                        items: string[];
                    };
                    rights: {
                        title: string;
                        intro: string;
                        items: string[];
                        contact: string;
                    };
                    children: {
                        title: string;
                        content: string;
                    };
                    changes: {
                        title: string;
                        content: string;
                    };
                    contact: {
                        title: string;
                        content: string;
                    };
                };
            };
        };
        upload: {
            title: string;
            description: string;
            requirements: {
                title: string;
                description: string;
            };
            buttons: {
                upload: string;
                continue: string;
                retry: string;
            };
            errors: {
                invalidFile: string;
                fileTooLarge: string;
                uploadFailed: string;
                invalidFileType: string;
                fileSizeExceeded: string;
                duplicateFile: string;
                uploadFailedCount_other: string;
            };
            progress: {
                uploading: string;
                processing: string;
                complete: string;
            };
            quality: {
                rejected: {
                    title: string;
                };
            };
        };
        homepage: {
            hero: {
                headline: string;
                tagline: string;
                subtitle: string;
            };
            story: {
                paragraph1: string;
                paragraph2: string;
                callToAction: string;
            };
            aria: {
                photoMetadata: string;
            };
            waitlist: {
                placeholder: string;
                ariaLabel: string;
                submitLabel: string;
                submittingLabel: string;
                validation: {
                    invalidEmail: string;
                };
                messages: {
                    alreadyOnWaitlist: string;
                    success: string;
                    defaultError: string;
                };
            };
        };
        account: {
            dialog: {
                title: string;
                selectSection: string;
            };
            navigation: {
                profile: string;
                subscription: string;
                settings: string;
                support: string;
            };
            buttons: {
                cancel: string;
                save: string;
                saving: string;
                signOut: string;
                subscribe: string;
                opening: string;
                manage: string;
                renew: string;
                buyCredits: string;
                deleteAccount: string;
            };
            profile: {
                title: string;
                firstName: string;
                lastName: string;
                email: string;
            };
            subscription: {
                title: string;
                loading: string;
                noPlan: string;
                planSuffix: string;
                cancelled: string;
                expires: string;
                renews: string;
                creditBalance: string;
                resets: string;
            };
            settings: {
                title: string;
                language: string;
                deleteAccount: {
                    title: string;
                    description: string;
                };
            };
            support: {
                title: string;
                description: string;
                faq: string;
                faqDescription: string;
                helpCenter: string;
                dmUs: string;
                emailUs: string;
            };
            errors: {
                failedToSave: string;
            };
            accessibility: {
                avatar: string;
                plan: string;
            };
        };
    };
};
export declare const SUPPORTED_LANGUAGES: readonly ["us", "gb", "cn", "es", "fr", "pt", "de", "jp", "it", "nl"];
export declare const DEFAULT_LANGUAGE = "us";
export declare const LANGUAGE_COOKIE_NAME = "i18n_lang";
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
export default i18n;
