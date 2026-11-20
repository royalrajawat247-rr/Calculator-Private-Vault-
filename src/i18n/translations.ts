import type { Language } from '../types/vault';

export interface TranslationDict {
  appTitle: string;
  brandSubtitle: string;
  vaultHeaderTitle: string;
  calcTitle: string;
  langToggleLabel: string;
  lockNow: string;
  vaultStatusPill: (totalItems: number) => string;
  themes: {
    light: string;
    cosmic: string;
    emerald: string;
    switchTooltip: string;
  };
  calculator: {
    setupPinHint: string;
    defaultCodeHint: string;
    unlockPrompt: string;
    lockoutMessage: (seconds: number) => string;
    incompleteExpr: string;
    mathError: string;
    unlockedToast: string;
    pinSavedToast: string;
    forgotPinBtn: string;
    resetLockTitle: string;
    resetLockBody: string;
    resetLockConfirm: string;
    resetLockToast: string;
  };
  nav: {
    gallery: string;
    notes: string;
    backup: string;
    settings: string;
  };
  stats: {
    mediaCount: (n: number) => string;
    notesCount: (n: number) => string;
    storageLabel: string;
  };
  gallery: {
    heading: string;
    subheading: string;
    importBtn: string;
    importing: string;
    storageChip: (sizeText: string) => string;
    quickPhotos: string;
    quickPhotosSub: string;
    quickVideos: string;
    quickVideosSub: string;
    quickPdfs: string;
    quickPdfsSub: string;
    quickSecureFolder: string;
    quickSecureFolderSub: string;
    selectBtn: string;
    sortLabel: string;
    sortNewest: string;
    sortOldest: string;
    sortLargest: string;
    sortSmallest: string;
    longPressHint: string;
    selectedCount: (n: number) => string;
    selectAll: string;
    clearSelection: string;
    exportSelected: string;
    deleteSelected: string;
    bulkExportedToast: (n: number) => string;
    confirmBulkDeleteTitle: (n: number) => string;
    confirmBulkDeleteBody: (n: number) => string;
    bulkDeletedToast: (n: number) => string;
    emptyTitle: string;
    emptyBody: string;
    importedToast: (n: number) => string;
    noValidMedia: string;
    saveError: string;
    downloadMedia: string;
    deleteMedia: string;
    confirmDeleteTitle: string;
    confirmDeleteBody: string;
    deletedToast: string;
    close: string;
    prevItem: string;
    nextItem: string;
    zoomIn: string;
    zoomOut: string;
    folderLibrary: string;
    folderTrash: (n: number) => string;
    trashNotice: string;
    clearTrashBtn: string;
    confirmClearTrashTitle: string;
    confirmClearTrashBody: (n: number) => string;
    trashClearedToast: string;
    restoreSelectedBtn: string;
    restoreSingleBtn: string;
    restoredToast: (n: number) => string;
    movedToTrashToast: string;
    bulkMovedToTrashToast: (n: number) => string;
    confirmTrashMoveTitle: string;
    confirmTrashMoveBody: string;
    confirmBulkTrashMoveTitle: (n: number) => string;
    confirmBulkTrashMoveBody: (n: number) => string;
    daysLeftShort: (days: number) => string;
    emptyTrashTitle: string;
    emptyTrashBody: string;
    photoBadge: string;
    videoBadge: string;
    pdfBadge: string;
  };
  notes: {
    heading: string;
    subheading: string;
    newEntryBtn: string;
    countChip: (n: number) => string;
    filterAll: string;
    filterNotes: string;
    filterDiary: string;
    allTagsFilter: string;
    tagPresets: {
      work: string;
      personal: string;
      ideas: string;
      passwords: string;
    };
    tagsLabel: string;
    customTagPlaceholder: string;
    addTagBtn: string;
    quickNote: string;
    personalDiary: string;
    passwordMemo: string;
    passwordTemplateTitle: string;
    kindNote: string;
    kindDiary: string;
    emptyTitle: string;
    emptyBody: string;
    untitled: string;
    editorCreateTitle: string;
    editorEditTitle: string;
    typeLabel: string;
    titleLabel: string;
    titlePlaceholder: string;
    dateLabel: string;
    bodyLabel: string;
    bodyPlaceholder: string;
    saveBtn: string;
    autoSavingLabel: string;
    autoSavedLabel: string;
    cancelBtn: string;
    deleteBtn: string;
    emptyFieldsToast: string;
    savedToast: string;
    deletedToast: string;
    confirmDeleteTitle: string;
    confirmDeleteBody: string;
    encryptedBadge: string;
  };
  backup: {
    heading: string;
    subheading: string;
    warningNotice: string;
    exportCardTitle: string;
    exportCardBody: string;
    exportBtn: string;
    exporting: string;
    lastBackupPrefix: string;
    neverBackedUp: string;
    exportSuccessToast: string;
    importCardTitle: string;
    importCardBody: string;
    importBtn: string;
    restoreModalTitle: string;
    restoreModalBody: string;
    restorePinPlaceholder: string;
    restoreConfirmBtn: string;
    restoreSuccessToast: (media: number, notes: number) => string;
    restoreErrorToast: string;
    storageCardTitle: string;
    storageUsedText: (sizeText: string, itemCount: number) => string;
    pinNeededForBackup: string;
  };
  settings: {
    pageTitle: string;
    pageSubtitle: string;
    heroBadgeTitle: string;
    heroSubtitle: string;
    heroChecks: [string, string, string, string];
    darkModeTitle: string;
    darkModeDesc: string;
    languageTitle: string;
    languageDesc: string;
    changePinTitle: string;
    changePinDesc: string;
    savePinBtn: string;
    resetPinBtn: string;
    resetPinConfirmTitle: string;
    resetPinConfirmBody: string;
    pinResetDefaultToast: string;
    resetPinModalTitle: string;
    currentPinLabel: string;
    newPinLabel: string;
    confirmNewPinLabel: string;
    pin4DigitsError: string;
    wrongCurrentPinError: string;
    pinsDoNotMatchError: string;
    pinUpdatedToast: string;
    shareCardTitle: string;
    shareCardDesc: string;
    shareWhatsappBtn: string;
    shareMessageText: string;
    moreAppsTitle: string;
    moreAppsSubtitle: string;
    openAppBtn: string;
    purePdfName: string;
    purePdfDesc: string;
    jobReadyName: string;
    jobReadyDesc: string;
    supportCardTitle: string;
    supportCardDesc: string;
    supportEmailBtn: string;
    supportCopyBtn: string;
    supportCopiedToast: string;
    privacyFaqTitle: string;
    privacyGuaranteeTitle: string;
    privacyPoint1Label: string;
    privacyPoint1Body: string;
    privacyPoint2Label: string;
    privacyPoint2Body: string;
    privacyPoint3Label: string;
    privacyPoint3Body: string;
    faqItems: Array<{ q: string; a: string }>;
  };
  pwa: {
    installBtn: string;
    iosInstallBtn: string;
    iosModalTitle: string;
    iosStep1: string;
    iosStep2: string;
    offlineBadge: string;
  };
  adSlot: {
    title: string;
    subtitle: string;
    caption: string;
  };
  common: {
    cancel: string;
    confirm: string;
    delete: string;
    save: string;
    close: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationDict> = {
  en: {
    appTitle: 'Royal Vault',
    brandSubtitle: 'RR Tech Labs',
    vaultHeaderTitle: 'Royal Vault',
    calcTitle: 'Calculator',
    langToggleLabel: 'हिंदी/EN',
    lockNow: 'Lock',
    vaultStatusPill: (totalItems) =>
      `AES-256 Encrypted • ${totalItems} ${totalItems === 1 ? 'Item' : 'Items'} • Offline`,
    themes: {
      light: '✨ Light',
      cosmic: '🌌 Cosmic 3D',
      emerald: '🌿 Emerald Leaves',
      switchTooltip: 'Switch live background theme',
    },
    calculator: {
      setupPinHint: 'Set a 4-digit PIN & press =',
      defaultCodeHint: 'Default PIN: 1234 + =',
      unlockPrompt: 'Standard',
      lockoutMessage: (s) => `Too many attempts · ${s}s`,
      incompleteExpr: 'Incomplete expression',
      mathError: 'Cannot divide by zero',
      unlockedToast: 'Vault unlocked',
      pinSavedToast: 'PIN saved & vault unlocked',
      forgotPinBtn: 'Forgot PIN?',
      resetLockTitle: 'Reset PIN to First-Time Setup?',
      resetLockBody:
        'Your Private Gallery files stay completely safe in IndexedDB. Resetting clears the current PIN so you can set a new 4-digit PIN on the calculator screen.',
      resetLockConfirm: 'Reset PIN',
      resetLockToast: 'Set a new 4-digit PIN & press =',
    },
    nav: {
      gallery: 'Gallery',
      notes: 'Notes',
      backup: 'Backup',
      settings: 'Settings',
    },
    stats: {
      mediaCount: (n) => `${n} ${n === 1 ? 'File' : 'Files'}`,
      notesCount: (n) => `${n} ${n === 1 ? 'Note' : 'Notes'}`,
      storageLabel: 'IndexedDB',
    },
    gallery: {
      heading: 'Private Gallery',
      subheading: 'Photos, videos, and PDFs are stored directly in local IndexedDB.',
      importBtn: 'Import Media',
      importing: 'Locking...',
      storageChip: (sizeText) => `IndexedDB · ${sizeText}`,
      quickPhotos: 'Import Photos',
      quickPhotosSub: 'JPG, PNG, WEBP',
      quickVideos: 'Hide Videos',
      quickVideosSub: 'MP4, MOV, WEBM',
      quickPdfs: 'Lock PDFs',
      quickPdfsSub: 'Private Docs',
      quickSecureFolder: 'Secure Folder',
      quickSecureFolderSub: 'All Vault Media',
      selectBtn: 'Select',
      sortLabel: 'Sort media',
      sortNewest: 'Newest',
      sortOldest: 'Oldest',
      sortLargest: 'Size: Largest',
      sortSmallest: 'Size: Smallest',
      longPressHint: 'Long-press any item for multi-select',
      selectedCount: (n) => `${n} selected`,
      selectAll: 'Select All',
      clearSelection: 'Clear',
      exportSelected: 'Export',
      deleteSelected: 'Delete',
      bulkExportedToast: (n) => `Exported ${n} ${n === 1 ? 'item' : 'items'}`,
      confirmBulkDeleteTitle: (n) => `Delete ${n} Selected ${n === 1 ? 'Item' : 'Items'}?`,
      confirmBulkDeleteBody: (n) =>
        `${n} selected ${n === 1 ? 'item' : 'items'} will be permanently removed from your on-device vault.`,
      bulkDeletedToast: (n) => `Removed ${n} ${n === 1 ? 'item' : 'items'} from vault`,
      emptyTitle: 'Private Gallery is Empty',
      emptyBody: 'Lock photos, videos, and private PDFs inside on-device IndexedDB.',
      importedToast: (n) => `${n} ${n === 1 ? 'item' : 'items'} locked in IndexedDB`,
      noValidMedia: 'No supported photo, video, or PDF files selected.',
      saveError: 'Could not save files to IndexedDB.',
      downloadMedia: 'Export to Device',
      deleteMedia: 'Delete',
      confirmDeleteTitle: 'Delete Protected File?',
      confirmDeleteBody: 'This item will be permanently removed from your on-device vault.',
      deletedToast: 'Item removed from vault',
      close: 'Close',
      prevItem: 'Previous item',
      nextItem: 'Next item',
      zoomIn: 'Zoom in',
      zoomOut: 'Reset zoom',
      folderLibrary: 'Library',
      folderTrash: (n) => `Recently Deleted (${n})`,
      trashNotice: 'Items stay here for 30 days before permanent IndexedDB removal.',
      clearTrashBtn: 'Clear Trash',
      confirmClearTrashTitle: 'Clear Recently Deleted?',
      confirmClearTrashBody: (n) =>
        `All ${n} ${n === 1 ? 'item' : 'items'} in Recently Deleted will be permanently erased from IndexedDB.`,
      trashClearedToast: 'Recently Deleted trash cleared',
      restoreSelectedBtn: 'Restore',
      restoreSingleBtn: 'Restore',
      restoredToast: (n) => `Restored ${n} ${n === 1 ? 'item' : 'items'} to Library`,
      movedToTrashToast: 'Moved to Recently Deleted (kept 30 days)',
      bulkMovedToTrashToast: (n) =>
        `Moved ${n} ${n === 1 ? 'item' : 'items'} to Recently Deleted (30 days)`,
      confirmTrashMoveTitle: 'Move to Recently Deleted?',
      confirmTrashMoveBody:
        'This file will stay in Recently Deleted for 30 days before permanent removal.',
      confirmBulkTrashMoveTitle: (n) => `Move ${n} ${n === 1 ? 'Item' : 'Items'} to Trash?`,
      confirmBulkTrashMoveBody: (n) =>
        `${n} selected ${n === 1 ? 'item' : 'items'} will be held in Recently Deleted for 30 days before permanent removal from IndexedDB.`,
      daysLeftShort: (days) => `${days}d`,
      emptyTrashTitle: 'Recently Deleted is Empty',
      emptyTrashBody: 'Deleted photos, videos, and PDFs are kept here for 30 days.',
      photoBadge: 'Photo',
      videoBadge: 'Video',
      pdfBadge: 'PDF',
    },
    notes: {
      heading: 'Secret Notes & Diary',
      subheading: 'AES-256-GCM encrypted notes & tagged diary logs stored strictly on-device.',
      newEntryBtn: 'New Entry',
      countChip: (n) => `AES-256 · ${n} ${n === 1 ? 'Entry' : 'Entries'}`,
      filterAll: 'All',
      filterNotes: 'Notes',
      filterDiary: 'Diary',
      allTagsFilter: 'All Tags',
      tagPresets: {
        work: 'Work',
        personal: 'Personal',
        ideas: 'Ideas',
        passwords: 'Passwords',
      },
      tagsLabel: 'Tags',
      customTagPlaceholder: 'Custom tag...',
      addTagBtn: 'Add',
      quickNote: 'Quick Note',
      personalDiary: 'Personal Diary',
      passwordMemo: 'Password Memo',
      passwordTemplateTitle: 'Account Credentials',
      kindNote: 'Note',
      kindDiary: 'Diary Log',
      emptyTitle: 'No Encrypted Entries Yet',
      emptyBody: 'Create a tagged private note, personal diary entry, or encrypted password memo.',
      untitled: 'Untitled Entry',
      editorCreateTitle: 'New Encrypted Entry',
      editorEditTitle: 'Edit Encrypted Entry',
      typeLabel: 'Entry Type',
      titleLabel: 'Title',
      titlePlaceholder: 'Enter a clear title...',
      dateLabel: 'Diary Date',
      bodyLabel: 'Content',
      bodyPlaceholder: 'Write privately here. Content is encrypted on-device...',
      saveBtn: 'Encrypt & Save',
      autoSavingLabel: 'Saving...',
      autoSavedLabel: 'Saved',
      cancelBtn: 'Cancel',
      deleteBtn: 'Delete Entry',
      emptyFieldsToast: 'Please enter a title or note content first.',
      savedToast: 'Encrypted and saved on device',
      deletedToast: 'Entry permanently deleted',
      confirmDeleteTitle: 'Delete Encrypted Entry?',
      confirmDeleteBody: 'This encrypted record will be permanently erased from local storage.',
      encryptedBadge: 'AES-256-GCM',
    },
    backup: {
      heading: 'Secure JSON Backup',
      subheading: 'Export or restore an AES-256 encrypted JSON snapshot of your entire vault.',
      warningNotice:
        'All files remain strictly inside your on-device browser storage. Export an encrypted JSON backup before clearing site data.',
      exportCardTitle: 'Export Encrypted Database',
      exportCardBody:
        'Packages gallery media, PDFs, and encrypted notes into a single AES-256-GCM encrypted JSON snapshot.',
      exportBtn: 'Export Encrypted Database',
      exporting: 'Encrypting...',
      lastBackupPrefix: 'Last export',
      neverBackedUp: 'No backup exported yet',
      exportSuccessToast: 'Encrypted JSON database downloaded',
      importCardTitle: 'Restore from JSON Backup',
      importCardBody:
        'Select a previously exported Royal Vault JSON file and enter the 4-digit PIN used to lock it.',
      importBtn: 'Restore from JSON Backup',
      restoreModalTitle: 'Enter Backup Passcode',
      restoreModalBody: 'Provide the 4-digit passcode that encrypted this JSON backup file.',
      restorePinPlaceholder: '4-digit PIN',
      restoreConfirmBtn: 'Decrypt & Merge',
      restoreSuccessToast: (m, n) => `Restored ${m} media files and ${n} notes`,
      restoreErrorToast: 'Incorrect passcode or invalid encrypted JSON backup file.',
      storageCardTitle: 'IndexedDB & Local Vault Engine',
      storageUsedText: (sizeText, itemCount) =>
        `${sizeText} stored in IndexedDB across ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`,
      pinNeededForBackup: 'Configure a 4-digit PIN first to encrypt your JSON backup.',
    },
    settings: {
      pageTitle: 'Settings',
      pageSubtitle: 'Compact enterprise controls, privacy policy & RR Tech Labs support.',
      heroBadgeTitle: 'ROYAL VAULT PRO • 100% FREE EDITION',
      heroSubtitle:
        'Royal Vault Pro Active • 100% Free Forever. Zero login, zero ads, and zero subscription fees.',
      heroChecks: ['Unlimited Space', 'AES-256 Local', 'Offline Vault', 'JSON Backup'],
      darkModeTitle: 'Dark Mode',
      darkModeDesc: 'Crisp Light Theme / Dark Mode',
      languageTitle: 'App Language',
      languageDesc: 'Instant English / Hindi switch',
      changePinTitle: '4-Digit Calculator PIN',
      changePinDesc: 'Save a custom passcode or reset to default 1234',
      savePinBtn: 'Save PIN',
      resetPinBtn: 'Reset PIN',
      resetPinConfirmTitle: 'Reset PIN to Default (1234)?',
      resetPinConfirmBody:
        'Your 4-digit unlock code will reset to 1234 and all saved notes will be re-encrypted safely.',
      pinResetDefaultToast: 'PIN reset to default 1234 (all notes preserved)',
      resetPinModalTitle: 'Set & Save 4-Digit PIN',
      currentPinLabel: 'Current 4-Digit PIN',
      newPinLabel: 'New 4-Digit PIN',
      confirmNewPinLabel: 'Confirm New 4-Digit PIN',
      pin4DigitsError: 'Passcode must be exactly 4 digits.',
      wrongCurrentPinError: 'Current passcode is incorrect.',
      pinsDoNotMatchError: 'New passcodes do not match.',
      pinUpdatedToast: '4-Digit PIN saved and notes re-encrypted',
      shareCardTitle: 'Share Royal Vault on WhatsApp',
      shareCardDesc: 'Invite friends to lock photos, videos & notes privately offline',
      shareWhatsappBtn: 'Share on WhatsApp',
      shareMessageText:
        'Check out Royal Vault — a 100% offline, AES-256 encrypted Calculator Vault to hide photos, videos, PDFs, and secret notes privately on your phone: https://calculator-royal-vault.web.app',
      moreAppsTitle: 'More Apps by RR Tech Labs',
      moreAppsSubtitle: '100% offline, privacy-first utility apps',
      openAppBtn: 'Open App',
      purePdfName: 'PurePDF',
      purePdfDesc: 'Offline PDF Scanner & Tools',
      jobReadyName: 'JobReady',
      jobReadyDesc: 'Offline CV & Resume Maker',
      supportCardTitle: 'RR Tech Labs • 24/7 User Support',
      supportCardDesc:
        'Direct support for Royal Vault users: royalrajawat247@gmail.com',
      supportEmailBtn: 'royalrajawat247@gmail.com',
      supportCopyBtn: 'Copy Email',
      supportCopiedToast: 'Copied: royalrajawat247@gmail.com',
      privacyFaqTitle: '100% Local On-Device Privacy Policy & FAQs',
      privacyGuaranteeTitle: 'Zero Data Collection Guarantee',
      privacyPoint1Label: 'Zero Data Collection & Zero Login:',
      privacyPoint1Body:
        'No account, email sign-up, or cloud login. Zero analytics or personal identifiers are ever collected.',
      privacyPoint2Label: 'Zero Server Uploads:',
      privacyPoint2Body:
        'Every photo, video, PDF, AES-256 note encryption, and JSON backup runs strictly inside your device.',
      privacyPoint3Label: 'Full On-Device Ownership:',
      privacyPoint3Body:
        'Media lives in local IndexedDB and notes stay AES-256 encrypted behind your 4-digit calculator PIN.',
      faqItems: [
        {
          q: 'How do 100% offline encryption & IndexedDB storage work?',
          a: 'Large photos, videos, and PDFs are saved natively as Blobs in local IndexedDB without lag, while notes use AES-256-GCM encryption.',
        },
        {
          q: 'How do I select multiple files in Private Gallery?',
          a: 'Long-press any item or tap Select to enter multi-select mode for bulk export or bulk deletion.',
        },
        {
          q: 'How do I organize Secret Notes with tags?',
          a: 'Assign Work, Personal, Ideas, Passwords, or custom tags inside any note and filter directly from the Notes screen.',
        },
      ],
    },
    pwa: {
      installBtn: 'Install App',
      iosInstallBtn: 'Install on iOS',
      iosModalTitle: 'Install Royal Vault on iPhone / iPad',
      iosStep1: '1. Tap the Share button in Safari.',
      iosStep2: '2. Scroll down and tap Add to Home Screen.',
      offlineBadge: 'Offline Mode — Running 100% locally',
    },
    adSlot: {
      title: 'Royal Vault 100% Free Edition',
      subtitle: 'Zero login • AES-256 on-device encryption • Offline PWA storage',
      caption: 'Sponsored · RR Tech Labs',
    },
    common: {
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      save: 'Save',
      close: 'Close',
    },
  },
  hi: {
    appTitle: 'रॉयल वॉल्ट',
    brandSubtitle: 'RR Tech Labs',
    vaultHeaderTitle: 'रॉयल वॉल्ट',
    calcTitle: 'कैलकुलेटर',
    langToggleLabel: 'हिंदी/EN',
    lockNow: 'लॉक',
    vaultStatusPill: (totalItems) => `AES-256 एन्क्रिप्टेड • ${totalItems} आइटम • ऑफ़लाइन`,
    themes: {
      light: '✨ लाइट',
      cosmic: '🌌 कॉस्मिक 3D',
      emerald: '🌿 एमराल्ड लीव्स',
      switchTooltip: 'लाइव बैकग्राउंड थीम बदलें',
    },
    calculator: {
      setupPinHint: '4-अंकीय PIN सेट करें और = दबाएं',
      defaultCodeHint: 'डिफ़ॉल्ट PIN: 1234 + =',
      unlockPrompt: 'सामान्य',
      lockoutMessage: (s) => `कई प्रयास · ${s}s`,
      incompleteExpr: 'अधूरा समीकरण',
      mathError: 'शून्य से भाग नहीं',
      unlockedToast: 'वॉल्ट अनलॉक हो गया',
      pinSavedToast: 'PIN सेव हो गया और वॉल्ट अनलॉक हुआ',
      forgotPinBtn: 'PIN भूल गए?',
      resetLockTitle: 'PIN को फर्स्ट-टाइम सेटअप पर रीसेट करें?',
      resetLockBody:
        'आपकी निजी गैलरी की फ़ाइलें IndexedDB में पूरी तरह सुरक्षित रहेंगी। रीसेट करने पर वर्तमान PIN हट जाएगा ताकि आप कैलकुलेटर स्क्रीन पर नया 4-अंकीय PIN सेट कर सकें।',
      resetLockConfirm: 'PIN रीसेट करें',
      resetLockToast: 'नया 4-अंकीय PIN सेट करें और = दबाएं',
    },
    nav: {
      gallery: 'गैलरी',
      notes: 'नोट्स',
      backup: 'बैकअप',
      settings: 'सेटिंग्स',
    },
    stats: {
      mediaCount: (n) => `${n} फ़ाइलें`,
      notesCount: (n) => `${n} नोट्स`,
      storageLabel: 'IndexedDB',
    },
    gallery: {
      heading: 'निजी गैलरी',
      subheading: 'फ़ोटो, वीडियो और PDF सीधे स्थानीय IndexedDB में सुरक्षित रहते हैं।',
      importBtn: 'मीडिया जोड़ें',
      importing: 'लॉक हो रहा है...',
      storageChip: (sizeText) => `IndexedDB · ${sizeText}`,
      quickPhotos: 'फ़ोटो जोड़ें',
      quickPhotosSub: 'JPG, PNG, WEBP',
      quickVideos: 'वीडियो छुपाएं',
      quickVideosSub: 'MP4, MOV, WEBM',
      quickPdfs: 'PDF लॉक करें',
      quickPdfsSub: 'निजी दस्तावेज़',
      quickSecureFolder: 'सुरक्षित फ़ोल्डर',
      quickSecureFolderSub: 'सभी वॉल्ट फ़ाइलें',
      selectBtn: 'चुनें',
      sortLabel: 'मीडिया क्रमबद्ध करें',
      sortNewest: 'नवीनतम',
      sortOldest: 'सबसे पुराना',
      sortLargest: 'आकार: सबसे बड़ा',
      sortSmallest: 'आकार: सबसे छोटा',
      longPressHint: 'मल्टी-सेलेक्ट के लिए किसी भी आइटम को दबाए रखें',
      selectedCount: (n) => `${n} चयनित`,
      selectAll: 'सभी चुनें',
      clearSelection: 'साफ़ करें',
      exportSelected: 'निर्यात',
      deleteSelected: 'हटाएं',
      bulkExportedToast: (n) => `${n} फ़ाइलें निर्यात की गईं`,
      confirmBulkDeleteTitle: (n) => `चयनित ${n} फ़ाइलें हटाएं?`,
      confirmBulkDeleteBody: (n) =>
        `चयनित ${n} फ़ाइलें आपके डिवाइस वॉल्ट से स्थायी रूप से हटा दी जाएंगी।`,
      bulkDeletedToast: (n) => `${n} फ़ाइलें वॉल्ट से हटा दी गईं`,
      emptyTitle: 'निजी गैलरी खाली है',
      emptyBody: 'ऑन-डिवाइस IndexedDB में फ़ोटो, वीडियो और निजी PDF सुरक्षित छिपाएं।',
      importedToast: (n) => `${n} फ़ाइलें IndexedDB में सुरक्षित हो गईं`,
      noValidMedia: 'कोई मान्य फ़ोटो, वीडियो या PDF फ़ाइल नहीं चुनी गई।',
      saveError: 'IndexedDB में फ़ाइलें सेव नहीं हो सकीं।',
      downloadMedia: 'डिवाइस पर निर्यात करें',
      deleteMedia: 'हटाएं',
      confirmDeleteTitle: 'सुरक्षित फ़ाइल हटाएं?',
      confirmDeleteBody: 'यह आइटम आपके डिवाइस वॉल्ट से स्थायी रूप से हटा दिया जाएगा।',
      deletedToast: 'आइटम वॉल्ट से हटाया गया',
      close: 'बंद करें',
      prevItem: 'पिछला आइटम',
      nextItem: 'अगला आइटम',
      zoomIn: 'ज़ूम इन',
      zoomOut: 'ज़ूम रीसेट',
      folderLibrary: 'लाइब्रेरी',
      folderTrash: (n) => `हाल में हटाए गए (${n})`,
      trashNotice: 'IndexedDB से स्थायी रूप से हटने से पहले आइटम यहाँ 30 दिनों तक रहते हैं।',
      clearTrashBtn: 'ट्रैश साफ़ करें',
      confirmClearTrashTitle: 'हाल में हटाए गए साफ़ करें?',
      confirmClearTrashBody: (n) =>
        `हाल में हटाए गए सभी ${n} आइटम IndexedDB से स्थायी रूप से मिटा दिए जाएंगे।`,
      trashClearedToast: 'हाल में हटाया गया ट्रैश साफ़ हो गया',
      restoreSelectedBtn: 'पुनर्स्थापित करें',
      restoreSingleBtn: 'पुनर्स्थापित करें',
      restoredToast: (n) => `${n} आइटम लाइब्रेरी में पुनर्स्थापित हुए`,
      movedToTrashToast: 'हाल में हटाए गए में भेजा गया (30 दिन सुरक्षित)',
      bulkMovedToTrashToast: (n) => `${n} आइटम हाल में हटाए गए में भेजे गए (30 दिन)`,
      confirmTrashMoveTitle: 'हाल में हटाए गए में भेजें?',
      confirmTrashMoveBody:
        'यह फ़ाइल स्थायी रूप से हटने से पहले 30 दिनों तक हाल में हटाए गए में सुरक्षित रहेगी।',
      confirmBulkTrashMoveTitle: (n) => `${n} चयनित आइटम ट्रैश में भेजें?`,
      confirmBulkTrashMoveBody: (n) =>
        `चयनित ${n} आइटम IndexedDB से स्थायी रूप से हटने से पहले 30 दिनों तक हाल में हटाए गए में रहेंगे।`,
      daysLeftShort: (days) => `${days}d`,
      emptyTrashTitle: 'हाल में हटाए गए खाली है',
      emptyTrashBody: 'हटाए गए फ़ोटो, वीडियो और PDF यहाँ 30 दिनों तक सुरक्षित रहते हैं।',
      photoBadge: 'फ़ोटो',
      videoBadge: 'वीडियो',
      pdfBadge: 'PDF',
    },
    notes: {
      heading: 'गुप्त नोट्स और डायरी',
      subheading: 'डिवाइस पर AES-256-GCM से एन्क्रिप्टेड नोट्स और टैग की गई डायरी।',
      newEntryBtn: 'नई प्रविष्टि',
      countChip: (n) => `AES-256 · ${n} प्रविष्टियाँ`,
      filterAll: 'सभी',
      filterNotes: 'नोट्स',
      filterDiary: 'डायरी',
      allTagsFilter: 'सभी टैग',
      tagPresets: {
        work: 'कार्य',
        personal: 'व्यक्तिगत',
        ideas: 'विचार',
        passwords: 'पासवर्ड',
      },
      tagsLabel: 'टैग',
      customTagPlaceholder: 'कस्टम टैग...',
      addTagBtn: 'जोड़ें',
      quickNote: 'त्वरित नोट',
      personalDiary: 'व्यक्तिगत डायरी',
      passwordMemo: 'पासवर्ड मेमो',
      passwordTemplateTitle: 'खाता विवरण',
      kindNote: 'नोट',
      kindDiary: 'डायरी लॉग',
      emptyTitle: 'अभी कोई एन्क्रिप्टेड प्रविष्टि नहीं है',
      emptyBody: 'टैग किया हुआ निजी नोट, व्यक्तिगत डायरी या एन्क्रिप्टेड पासवर्ड मेमो लिखें।',
      untitled: 'बिना शीर्षक प्रविष्टि',
      editorCreateTitle: 'नई एन्क्रिप्टेड प्रविष्टि',
      editorEditTitle: 'एन्क्रिप्टेड प्रविष्टि संपादित करें',
      typeLabel: 'प्रविष्टि प्रकार',
      titleLabel: 'शीर्षक',
      titlePlaceholder: 'स्पष्ट शीर्षक लिखें...',
      dateLabel: 'डायरी दिनांक',
      bodyLabel: 'विवरण',
      bodyPlaceholder: 'यहाँ निजी रूप से लिखें। सामग्री डिवाइस पर ही एन्क्रिप्ट होती है...',
      saveBtn: 'एन्क्रिप्ट व सेव करें',
      autoSavingLabel: 'सेव हो रहा है...',
      autoSavedLabel: 'Saved',
      cancelBtn: 'रद्द करें',
      deleteBtn: 'प्रविष्टि हटाएं',
      emptyFieldsToast: 'कृपया पहले शीर्षक या सामग्री लिखें।',
      savedToast: 'डिवाइस पर एन्क्रिप्ट होकर सेव हो गया',
      deletedToast: 'प्रविष्टि स्थायी रूप से हटा दी गई',
      confirmDeleteTitle: 'एन्क्रिप्टेड प्रविष्टि हटाएं?',
      confirmDeleteBody: 'यह एन्क्रिप्टेड डेटा स्थानीय स्टोरेज से स्थायी रूप से मिटा दिया जाएगा।',
      encryptedBadge: 'AES-256-GCM',
    },
    backup: {
      heading: 'सुरक्षित JSON बैकअप',
      subheading: 'पूरे वॉल्ट का AES-256 एन्क्रिप्टेड JSON स्नैपशॉट निर्यात या पुनर्स्थापित करें।',
      warningNotice:
        'सभी फ़ाइलें केवल आपके डिवाइस ब्राउज़र में रहती हैं। साइट डेटा साफ़ करने से पहले हमेशा एन्क्रिप्टेड JSON बैकअप निर्यात करें।',
      exportCardTitle: 'एन्क्रिप्टेड डेटाबेस निर्यात करें',
      exportCardBody:
        'गैलरी मीडिया, PDF और एन्क्रिप्टेड नोट्स को एक AES-256-GCM एन्क्रिप्टेड JSON स्नैपशॉट में पैकेज करता है।',
      exportBtn: 'एन्क्रिप्टेड डेटाबेस निर्यात करें',
      exporting: 'एन्क्रिप्ट हो रहा है...',
      lastBackupPrefix: 'अंतिम बैकअप',
      neverBackedUp: 'अभी तक कोई बैकअप निर्यात नहीं किया गया',
      exportSuccessToast: 'एन्क्रिप्टेड JSON डेटाबेस डाउनलोड हो गया',
      importCardTitle: 'JSON बैकअप से पुनर्स्थापित करें',
      importCardBody:
        'पहले से निर्यात की गई रॉयल वॉल्ट JSON फ़ाइल चुनें और उसे लॉक करने वाला 4-अंकीय PIN दर्ज करें।',
      importBtn: 'JSON बैकअप से पुनर्स्थापित करें',
      restoreModalTitle: 'बैकअप पासकोड दर्ज करें',
      restoreModalBody: 'इस JSON बैकअप फ़ाइल को एन्क्रिप्ट करने वाला 4-अंकीय पासकोड डालें।',
      restorePinPlaceholder: '4-अंकीय PIN',
      restoreConfirmBtn: 'डिक्रिप्ट व मर्ज करें',
      restoreSuccessToast: (m, n) => `${m} मीडिया फ़ाइलें और ${n} नोट्स पुनर्स्थापित हुए`,
      restoreErrorToast: 'गलत पासकोड या अमान्य एन्क्रिप्टेड JSON बैकअप फ़ाइल।',
      storageCardTitle: 'IndexedDB और स्थानीय वॉल्ट इंजन',
      storageUsedText: (sizeText, itemCount) =>
        `IndexedDB में ${itemCount} आइटम में ${sizeText} संग्रहीत`,
      pinNeededForBackup: 'JSON बैकअप एन्क्रिप्ट करने के लिए पहले 4-अंकीय PIN सेट करें।',
    },
    settings: {
      pageTitle: 'सेटिंग्स',
      pageSubtitle: 'सुरक्षा नियंत्रण, गोपनीयता नीति और RR Tech Labs सहायता।',
      heroBadgeTitle: 'ROYAL VAULT PRO • 100% मुफ़्त संस्करण',
      heroSubtitle:
        'Royal Vault Pro सक्रिय • हमेशा के लिए 100% मुफ़्त। शून्य लॉगिन, शून्य विज्ञापन और शून्य शुल्क।',
      heroChecks: ['असीमित स्पेस', 'AES-256 स्थानीय', 'ऑफ़लाइन वॉल्ट', 'JSON बैकअप'],
      darkModeTitle: 'डार्क मोड',
      darkModeDesc: 'स्वच्छ लाइट थीम / डार्क मोड',
      languageTitle: 'ऐप भाषा',
      languageDesc: 'तुरंत English / हिंदी बदलें',
      changePinTitle: '4-अंकीय कैलकुलेटर PIN',
      changePinDesc: 'कस्टम पासकोड सेव करें या 1234 पर रीसेट करें',
      savePinBtn: 'Save PIN',
      resetPinBtn: 'Reset PIN',
      resetPinConfirmTitle: 'PIN को डिफ़ॉल्ट (1234) पर रीसेट करें?',
      resetPinConfirmBody:
        'आपका 4-अंकीय अनलॉक कोड 1234 पर रीसेट हो जाएगा और सभी नोट्स सुरक्षित रूप से पुनः एन्क्रिप्ट हो जाएंगे।',
      pinResetDefaultToast: 'PIN डिफ़ॉल्ट 1234 पर रीसेट हो गया (सभी नोट्स सुरक्षित हैं)',
      resetPinModalTitle: '4-अंकीय PIN सेट व सेव करें',
      currentPinLabel: 'वर्तमान 4-अंकीय PIN',
      newPinLabel: 'नया 4-अंकीय PIN',
      confirmNewPinLabel: 'नए 4-अंकीय PIN की पुष्टि करें',
      pin4DigitsError: 'पासकोड ठीक 4 अंकों का होना चाहिए।',
      wrongCurrentPinError: 'वर्तमान पासकोड गलत है।',
      pinsDoNotMatchError: 'नए पासकोड मेल नहीं खाते।',
      pinUpdatedToast: '4-अंकीय PIN सेव हो गया और नोट्स पुनः एन्क्रिप्ट हो गए',
      shareCardTitle: 'WhatsApp पर रॉयल वॉल्ट शेयर करें',
      shareCardDesc: 'दोस्तों के साथ 100% ऑफ़लाइन निजी वॉल्ट ऐप शेयर करें',
      shareWhatsappBtn: 'WhatsApp पर शेयर करें',
      shareMessageText:
        'रॉयल वॉल्ट देखें — फ़ोटो, वीडियो, PDF और गुप्त नोट्स को ऑफ़लाइन AES-256 सुरक्षा में छुपाने वाला कैलकुलेटर वॉल्ट ऐप: https://calculator-royal-vault.web.app',
      moreAppsTitle: 'RR Tech Labs के अन्य ऐप्स',
      moreAppsSubtitle: '100% ऑफ़लाइन और गोपनीयता-केंद्रित ऐप्स',
      openAppBtn: 'ऐप खोलें',
      purePdfName: 'PurePDF',
      purePdfDesc: 'ऑफ़लाइन PDF स्कैनर और टूल्स',
      jobReadyName: 'JobReady',
      jobReadyDesc: 'ऑफ़लाइन CV और रेज़्यूमे मेकर',
      supportCardTitle: 'RR Tech Labs • 24/7 उपयोगकर्ता सहायता',
      supportCardDesc: 'सीधा संपर्क ईमेल: royalrajawat247@gmail.com',
      supportEmailBtn: 'royalrajawat247@gmail.com',
      supportCopyBtn: 'ईमेल कॉपी करें',
      supportCopiedToast: 'कॉपी किया गया: royalrajawat247@gmail.com',
      privacyFaqTitle: '100% स्थानीय ऑन-डिवाइस गोपनीयता नीति और FAQs',
      privacyGuaranteeTitle: 'शून्य डेटा संग्रह गारंटी',
      privacyPoint1Label: 'शून्य डेटा संग्रह और शून्य लॉगिन:',
      privacyPoint1Body:
        'कोई खाता, ईमेल साइन-अप या क्लाउड लॉगिन नहीं। कोई एनालिटिक्स या व्यक्तिगत डेटा एकत्र नहीं किया जाता।',
      privacyPoint2Label: 'शून्य सर्वर अपलोड:',
      privacyPoint2Body:
        'प्रत्येक फ़ोटो, वीडियो, PDF, AES-256 नोट एन्क्रिप्शन और JSON बैकअप पूरी तरह आपके डिवाइस में चलता है।',
      privacyPoint3Label: 'पूर्ण ऑन-डिवाइस स्वामित्व:',
      privacyPoint3Body:
        'मीडिया स्थानीय IndexedDB में और नोट्स आपके 4-अंकीय कैलकुलेटर PIN से सुरक्षित रहते हैं।',
      faqItems: [
        {
          q: '100% ऑफ़लाइन एन्क्रिप्शन और IndexedDB स्टोरेज कैसे काम करते हैं?',
          a: 'बड़े फ़ोटो, वीडियो और PDF बिना लैग के सीधे स्थानीय IndexedDB में Blob के रूप में सहेजे जाते हैं, और नोट्स AES-256-GCM से सुरक्षित रहते हैं।',
        },
        {
          q: 'निजी गैलरी में एक साथ कई फ़ाइलें कैसे चुनें?',
          a: 'बल्क एक्सपोर्ट या बल्क डिलीट के लिए किसी भी आइटम को दबाए रखें या चुनें बटन दबाएं।',
        },
        {
          q: 'मैं टैग के साथ गुप्त नोट्स को कैसे व्यवस्थित करूँ?',
          a: 'किसी भी नोट में कार्य, व्यक्तिगत, विचार, पासवर्ड या कस्टम टैग जोड़ें और सीधे नोट्स स्क्रीन से फ़िल्टर करें।',
        },
      ],
    },
    pwa: {
      installBtn: 'ऐप इंस्टॉल करें',
      iosInstallBtn: 'iOS पर इंस्टॉल करें',
      iosModalTitle: 'iPhone / iPad पर रॉयल वॉल्ट इंस्टॉल करें',
      iosStep1: '1. Safari में Share बटन दबाएं।',
      iosStep2: '2. नीचे स्क्रॉल करें और Add to Home Screen चुनें।',
      offlineBadge: 'ऑफ़लाइन मोड — 100% स्थानीय रूप से सक्रिय',
    },
    adSlot: {
      title: 'Royal Vault 100% मुफ़्त संस्करण',
      subtitle: 'शून्य लॉगिन • AES-256 ऑन-डिवाइस एन्क्रिप्शन • ऑफ़लाइन PWA स्टोरेज',
      caption: 'Sponsored · RR Tech Labs',
    },
    common: {
      cancel: 'रद्द करें',
      confirm: 'पुष्टि करें',
      delete: 'हटाएं',
      save: 'सेव करें',
      close: 'बंद करें',
    },
  },
};
