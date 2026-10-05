/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { DataEditorModal } from './components/DataEditorModal';
import { ConnectSheetModal } from './components/ConnectSheetModal';
import { GettingStartedModal } from './components/GettingStartedModal';
import { ThemeModal } from './components/ThemeModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { MyDashboardsModal } from './components/MyDashboardsModal';
import { DeveloperConsole } from './components/DeveloperConsole';
import { AdminPlatform } from './components/AdminPlatform/AdminPlatform';
import { AdminAccessGate } from './components/AdminAccessGate';
import { PublicViewerPortal } from './components/PublicViewerPortal';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { WelcomeLandingPortal } from './components/WelcomeLandingPortal';
import { AuthModal } from './components/AuthModal';
import { AssignedTemplatesModal } from './components/AssignedTemplatesModal';
import { UserPublishModal } from './components/UserPublishModal';
import { UserProfileModal } from './components/UserProfileModal';
import { UserNotificationsModal } from './components/UserNotificationsModal';
import { DataSourceModal } from './components/DataSourceModal';
import { TestLabBar } from './components/TestLabBar';
import { getThemeStyles } from './utils/themeStyles';
import {
  getSiteStatus,
  SiteStatus,
  toggleSiteOnline,
  isAdminAuthenticatedSession,
  logoutAdminSession,
  startSiteStatusSync,
  fetchSiteStatusFromServer,
} from './services/siteStatusStore';
import { Lock } from 'lucide-react';

import {
  VisualWidget,
  VisualType,
  SalesRecord,
  FilterState,
  SheetConnectionConfig,
  ThemeConfig,
  DashboardVersion,
  TeamUser,
  DashboardTemplate,
} from './types';
import { getCurrentUser, logoutTeamUser, loginTeamUserAsync, syncSessionFromServer, DEFAULT_USERS, mapDBUserToTeamUser } from './services/teamAuthStore';
import {
  saveUserDashboard,
  saveUserDashboardAsync,
  loadUserDashboard,
  loadUserDashboardFromCloud,
  loadDashboardByShareParams,
  clearUserDashboardSession,
  getStarterUserDashboard,
  getUserSalesDataKey,
  refreshUserLiveData,
  UserDashboardData,
} from './services/userDashboardStore';
import { dbGetAllUsers } from './services/cloudDatabase';
import {
  exportDashboardToFile,
  importDashboardFromFile,
  loadDashboardFromServerFile,
} from './services/fileStorageService';
import { applyGlobalFilters, autoOrganizeWidgets } from './utils/calcEngine';
import { INITIAL_SALES_RECORDS, INITIAL_WIDGETS } from './data/sampleData';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  getCachedAccessToken,
} from './services/googleAuth';
import {
  fetchSheetRowsWithConfig,
  fetchSpreadsheetMetadata,
} from './services/googleSheets';

export default function App() {
  // Team Auth State & RBAC first for isolated data loading
  const [currentTeamUser, setCurrentTeamUser] = useState<TeamUser | null>(() => getCurrentUser());

  // Bootstrap initial dashboard data specifically for this user
  const initialUserDash = useMemo(() => {
    if (currentTeamUser?.id) {
      return loadUserDashboard(currentTeamUser.id) || getStarterUserDashboard(currentTeamUser);
    }
    return null;
  }, [currentTeamUser?.id]);

  // Main Data and Widgets with user-isolated persistent storage support
  const [widgets, setWidgets] = useState<VisualWidget[]>(() => initialUserDash?.widgets || INITIAL_WIDGETS);
  const [salesData, setSalesData] = useState<SalesRecord[]>(() => initialUserDash?.salesData || INITIAL_SALES_RECORDS);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>(() => initialUserDash?.widgets?.[0]?.id || 'chart-category');
  const [dashboardTitle, setDashboardTitle] = useState<string>(() => initialUserDash?.dashboardTitle || (currentTeamUser ? `แดชบอร์ดของ ${currentTeamUser.displayName}` : 'ภาพรวมยอดขาย'));
  const [isSaved, setIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToastMsg, setSaveToastMsg] = useState<string | null>(null);

  // Automatically persist user-specific salesData locally
  useEffect(() => {
    if (typeof window !== 'undefined' && currentTeamUser?.id && Array.isArray(salesData) && salesData.length > 0) {
      try {
        localStorage.setItem(getUserSalesDataKey(currentTeamUser.id), JSON.stringify(salesData));
      } catch (e) {
        console.warn('Failed to persist isolated salesData', e);
      }
    }
  }, [salesData, currentTeamUser?.id]);

  // Theme State
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => initialUserDash?.themeConfig || {
    preset: 'violet',
    primaryColor: '#7c3aed',
    fontFamily: 'Prompt',
    borderRadius: 'rounded-lg',
    shadowStyle: 'shadow-sm',
    density: 'comfortable',
  });

  // Version History
  const [dashboardVersions, setDashboardVersions] = useState<DashboardVersion[]>([
    {
      id: 'v-initial',
      title: 'ภาพรวมยอดขาย (เวอร์ชันเริ่มต้น)',
      timestamp: '15:30 (บันทึกอัตโนมัติ)',
      widgets: INITIAL_WIDGETS,
      salesData: INITIAL_SALES_RECORDS,
    },
  ]);

  // Inspector & Layout
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('canvas');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  // Domain and Route detection for isolating 3 Environments:
  // 1. Production User Website (Base root / without any query or path) -> clean, no dev or test buttons!
  // 2. Admin Backoffice Platform -> accessible via /dev or ?portal=admin or ?portal=dev
  // 3. QA Test Lab -> accessible via /test or #test or ?portal=test
  const VERCEL_PROD_DOMAIN = 'dashboad-rose.vercel.app';
  const SHARED_PROD_DOMAIN = 'ais-pre-aa2zmjdacxdmdrezttgtgd-153425927614.asia-southeast1.run.app';
  const DEV_TEST_DOMAIN = 'ais-dev-aa2zmjdacxdmdrezttgtgd-153425927614.asia-southeast1.run.app';

  const resolveCurrentViewMode = (): 'studio' | 'dev_console' | 'public_viewer' => {
    if (typeof window === 'undefined') return 'studio';
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    // 1. Explicit Admin / Dev Backoffice request (/dev, /admin, ?portal=dev, ?portal=admin, #dev)
    const isAdmin =
      path === '/dev' ||
      path.startsWith('/dev/') ||
      path === '/admin' ||
      path.startsWith('/admin/') ||
      params.get('portal') === 'dev' ||
      params.get('portal') === 'admin' ||
      params.get('mode') === 'dev' ||
      params.get('mode') === 'admin' ||
      params.get('portal') === 'dev_console' ||
      hash === '#dev' ||
      hash.includes('dev') ||
      hash.includes('admin');
    if (isAdmin) {
      return 'dev_console';
    }

    // 2. Explicit Viewer request (?portal=viewer, /view, #viewer)
    const isViewer =
      params.get('portal') === 'viewer' ||
      params.get('mode') === 'viewer' ||
      params.get('view') === 'public' ||
      path.startsWith('/view') ||
      hash.includes('viewer') ||
      hash.includes('public');
    if (isViewer) {
      return 'public_viewer';
    }

    // 3. Clean User Portal / Studio (Default)
    return 'studio';
  };

  const checkIsTestEnvironment = (): boolean => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    // Test environment strictly when user navigates to /test or #test or ?portal=test
    return (
      path === '/test' ||
      path.startsWith('/test/') ||
      params.get('mode') === 'test' ||
      params.get('portal') === 'test' ||
      hash === '#test' ||
      hash.includes('test')
    );
  };

  const [viewMode, setViewMode] = useState<'studio' | 'dev_console' | 'public_viewer'>(resolveCurrentViewMode);
  const [isTestRoute, setIsTestRoute] = useState<boolean>(checkIsTestEnvironment);

  // Domain & Route navigation between:
  // 1. User Portal (/)
  // 2. Dev Admin Backoffice (/dev)
  // 3. QA Test Lab (/test)
  const handleNavigateToTestPortal = () => {
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({}, '', '/test');
      } catch (e) {
        window.location.hash = '#test';
      }
    }
    setIsTestRoute(true);
    setViewMode('studio');
  };

  const handleNavigateToDevAdmin = () => {
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({}, '', '/dev');
      } catch (e) {
        window.location.hash = '#dev';
      }
    }
    setViewMode('dev_console');
  };

  const handleNavigateToUserPortal = () => {
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({}, '', '/');
      } catch (e) {
        window.location.hash = '';
      }
    }
    setIsTestRoute(false);
    setViewMode('studio');
  };

  const handleOpenAdminPlatform = () => {
    handleNavigateToDevAdmin();
  };

  const handleTestQuickSwitchUser = async (email: string) => {
    if (currentTeamUser?.id) {
      try {
        saveUserDashboard(currentTeamUser.id, {
          widgets,
          salesData,
          dashboardTitle,
          themeConfig,
          filterState,
          connectionConfig,
          spacingMode,
        });
      } catch (e) {}
    }
    const res = await loginTeamUserAsync(email, 'password123');
    if (res.success && res.user) {
      setCurrentTeamUser(res.user);
      applyUserDashboard(res.user);
    }
  };

  // Sync URL changes with viewMode and test route
  useEffect(() => {
    const handlePopState = () => {
      setViewMode(resolveCurrentViewMode());
      setIsTestRoute(checkIsTestEnvironment());
    };

    const handleSessionUpdate = (e?: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent && customEvent.detail !== undefined) {
        setCurrentTeamUser(customEvent.detail);
      } else {
        setCurrentTeamUser(getCurrentUser());
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    window.addEventListener('team_session_changed', handleSessionUpdate);
    window.addEventListener('admin_auth_changed', handleSessionUpdate);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
      window.removeEventListener('team_session_changed', handleSessionUpdate);
      window.removeEventListener('admin_auth_changed', handleSessionUpdate);
    };
  }, []);

  // Global Real-time Site Status (ปิด/เปิดระบบพร้อมกันทั่วโลกทุกบราวเซอร์)
  const [siteStatus, setSiteStatus] = useState<SiteStatus>(getSiteStatus());
  const [adminBypass, setAdminBypass] = useState(false);
  const [sharedCreatorName, setSharedCreatorName] = useState<string>('');

  useEffect(() => {
    // Active multi-browser real-time synchronization
    const unsubscribe = startSiteStatusSync((newStatus) => {
      setSiteStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  const [filterState, setFilterState] = useState<FilterState>(() => initialUserDash?.filterState || {
    regions: [],
    categories: [],
    skipBlanks: false,
    crossFilter: null,
    customRules: [],
  });
  const [spacingMode, setSpacingMode] = useState<string>(() => initialUserDash?.spacingMode || 'ปกติ');

  // Connection & Sync
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionConfig, setConnectionConfig] = useState<SheetConnectionConfig>(() => {
    if (initialUserDash?.connectionConfig) {
      return initialUserDash.connectionConfig;
    }
    if (typeof window !== 'undefined' && currentTeamUser?.id) {
      try {
        const stored = localStorage.getItem(`user_sheet_config_${currentTeamUser.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') return parsed;
        }
      } catch (e) {
        console.warn('Failed to load user sheet config', e);
      }
    }
    return {
      spreadsheetId: '',
      spreadsheetTitle: 'ยอดขายรายไตรมาส',
      sheetName: 'ยอดขายรายไตรมาส',
      availableSheets: ['ยอดขายรายไตรมาส', 'Sheet1'],
      headerRow: 1,
      dataStartRow: 2,
      dataEndRow: null,
      status: 'connected',
      lastSyncedAt: '08:22',
      mode: 'sample',
      detectedHeaders: [
        'ลำดับ',
        'วันที่',
        'เลขที่คำสั่งซื้อ',
        'ชื่อสินค้า',
        'หมวดหมู่',
        'ภูมิภาค',
        'จำนวน',
        'ยอดขาย (บาท)',
        'ต้นทุน (บาท)',
        'กำไรขั้นต้น (บาท)',
      ],
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && connectionConfig && currentTeamUser?.id) {
      try {
        localStorage.setItem(`user_sheet_config_${currentTeamUser.id}`, JSON.stringify(connectionConfig));
      } catch (e) {
        console.warn(e);
      }
    }
  }, [connectionConfig, currentTeamUser?.id]);

  // Modals
  const [isDataEditorOpen, setIsDataEditorOpen] = useState(false);
  const [isDataSourceModalOpen, setIsDataSourceModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isGettingStartedOpen, setIsGettingStartedOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isMyDashboardsOpen, setIsMyDashboardsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAssignedTemplatesOpen, setIsAssignedTemplatesOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Google Auth State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Core User-Isolated Dashboard Loader & Live Sync
  // กราฟและการ์ดทุกชิ้นจะจำค่าเดิมไว้ ข้อมูลไม่หายเมื่อล็อกอินเข้าออก
  const isPopulatingUserDataRef = React.useRef(true);

  const applyDashboardData = React.useCallback(
    (data: UserDashboardData) => {
      isPopulatingUserDataRef.current = true;
      if (data.widgets && data.widgets.length > 0) {
        setWidgets(data.widgets);
        setHistory([data.widgets]);
        setHistoryIndex(0);
        setSelectedWidgetId(data.widgets[0]?.id || '');
      }
      if (data.salesData && data.salesData.length > 0) {
        setSalesData(data.salesData);
      } else {
        setSalesData(INITIAL_SALES_RECORDS);
      }
      if (data.dashboardTitle) {
        setDashboardTitle(data.dashboardTitle);
      }
      if (data.themeConfig) {
        setThemeConfig(data.themeConfig);
      }
      if (data.filterState) {
        setFilterState(data.filterState);
      }
      if (data.connectionConfig) {
        setConnectionConfig(data.connectionConfig);
      }
      if (data.spacingMode) {
        setSpacingMode(data.spacingMode);
      }
      setIsSaved(true);
      if (data.lastSavedAt) {
        setLastSavedTime(data.lastSavedAt);
      }

      // Unlock after state flush
      setTimeout(() => {
        isPopulatingUserDataRef.current = false;
      }, 300);
    },
    []
  );

  const applyUserDashboard = React.useCallback(
    (user: TeamUser | null) => {
      if (!user) {
        // Reset to clean default state on logout
        isPopulatingUserDataRef.current = true;
        setWidgets(INITIAL_WIDGETS);
        setSalesData(INITIAL_SALES_RECORDS);
        setDashboardTitle('ภาพรวมยอดขาย');
        setFilterState({ regions: [], categories: [], skipBlanks: false, crossFilter: null, customRules: [] });
        setConnectionConfig({
          spreadsheetId: '',
          spreadsheetTitle: 'ยอดขายรายไตรมาส',
          sheetName: 'ยอดขายรายไตรมาส',
          availableSheets: ['ยอดขายรายไตรมาส', 'Sheet1'],
          headerRow: 1,
          dataStartRow: 2,
          dataEndRow: null,
          status: 'connected',
          lastSyncedAt: null,
          mode: 'sample',
          detectedHeaders: ['ลำดับ', 'วันที่', 'เลขที่คำสั่งซื้อ', 'ชื่อสินค้า', 'หมวดหมู่', 'ภูมิภาค', 'จำนวน', 'ยอดขาย (บาท)', 'ต้นทุน (บาท)', 'กำไรขั้นต้น (บาท)'],
        });
        setSpacingMode('ปกติ');
        setThemeConfig({
          preset: 'violet',
          primaryColor: '#7c3aed',
          fontFamily: 'Prompt',
          borderRadius: 'rounded-lg',
          shadowStyle: 'shadow-sm',
          density: 'comfortable',
        });
        setHistory([INITIAL_WIDGETS]);
        setHistoryIndex(0);
        setSelectedWidgetId(INITIAL_WIDGETS[0]?.id || '');
        setTimeout(() => {
          isPopulatingUserDataRef.current = false;
        }, 150);
        return;
      }

      const targetUserId = user?.id || (user as any)?.userId;
      if (!targetUserId) {
        setTimeout(() => {
          isPopulatingUserDataRef.current = false;
        }, 150);
        return;
      }

      // 1. Fast initial bootstrap from local cache (<1ms) so screen renders without blinking
      const cached = loadUserDashboard(targetUserId);
      if (cached && cached.widgets && cached.widgets.length > 0) {
        applyDashboardData(cached);
      }

      // 2. Database-First Single Source of Truth: ALWAYS fetch authoritative dashboard from Server & Cloud
      loadUserDashboardFromCloud(targetUserId)
        .then((cloudData) => {
          if (cloudData && cloudData.widgets && cloudData.widgets.length > 0) {
            applyDashboardData(cloudData);
          } else if (!cached || !cached.widgets || cached.widgets.length === 0) {
            const starter = getStarterUserDashboard(user);
            applyDashboardData(starter);
            saveUserDashboard(targetUserId, starter);
          }
        })
        .catch(() => {
          if (!cached || !cached.widgets || cached.widgets.length === 0) {
            const starter = getStarterUserDashboard(user);
            applyDashboardData(starter);
            saveUserDashboard(targetUserId, starter);
          }
        })
        .finally(() => {
          setTimeout(() => {
            isPopulatingUserDataRef.current = false;
          }, 300);
        });

      // 3. Live Real-Time Google Sheets refresh (ดึงข้อมูลแบบเรียลไทม์เมื่อเปิดหรือเมื่อชีทอัปเดต)
      const targetConfig = cached?.connectionConfig;
      if (targetConfig && targetConfig.spreadsheetId) {
        setIsSyncing(true);
        refreshUserLiveData(user.id, targetConfig, accessToken).then((res) => {
          setIsSyncing(false);
          if (res.success && res.records && res.records.length > 0) {
            setSalesData(res.records);
            if (res.headers && res.headers.length > 0) {
              setConnectionConfig((prev) => ({
                ...prev,
                detectedHeaders: res.headers!,
                lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
              }));
            }
          }
        }).catch(() => {
          setIsSyncing(false);
        });
      }
    },
    [accessToken, applyDashboardData]
  );

  // When opening viewer portal (?portal=viewer&user=...&dash=...), load the creator's exact customized dashboard
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const targetUser = params.get('user');
    const targetDash = params.get('dash');

    if (targetUser || targetDash) {
      // If active user is previewing their own design in this tab, keep in-memory state so it matches 100%
      if (currentTeamUser && (currentTeamUser.id === targetUser || !targetUser) && widgets.length > 0) {
        return;
      }
      loadDashboardByShareParams(targetUser, targetDash).then((sharedData) => {
        if (sharedData && sharedData.widgets && sharedData.widgets.length > 0) {
          applyDashboardData(sharedData);
        }
      });

      if (targetUser) {
        dbGetAllUsers().then((allUsers) => {
          const found = allUsers.find(
            (u) => u.userId === targetUser || u.email.toLowerCase() === targetUser.toLowerCase()
          );
          if (found) {
            setSharedCreatorName(found.name);
          }
        });
      }
    }
  }, [viewMode, applyDashboardData]);

  const handleTeamLogout = () => {
    // 1. Force flush current user's changes to storage BEFORE logging out!
    if (currentTeamUser?.id) {
      try {
        saveUserDashboard(currentTeamUser.id, {
          widgets,
          salesData,
          dashboardTitle,
          themeConfig,
          filterState,
          connectionConfig,
          spacingMode,
        });
      } catch (e) {
        console.warn('Logout save notice', e);
      }
    }
    // 2. Clear user session and clean up React state
    logoutTeamUser();
    clearUserDashboardSession();
    setCurrentTeamUser(null);
    applyUserDashboard(null);
    setIsAuthModalOpen(false);
    if (viewMode === 'dev_console') {
      setViewMode('studio');
    }
  };

  // Perform save to Cloud Database & Server File System
  // Saves as user's latest work ("ผลงานล่าสุด"), overwriting latest active draft when saved again.
  // Saved preset templates and organization templates remain 100% untouched and safe!
  const performSave = React.useCallback(
    async (isManual = false) => {
      const activeUser = currentTeamUser || getCurrentUser();
      if (!activeUser?.id) return;
      if (!isManual && isPopulatingUserDataRef.current) return;

      setIsSaving(true);
      try {
        const res = await saveUserDashboardAsync(activeUser.id, {
          widgets,
          salesData,
          dashboardTitle,
          themeConfig,
          filterState,
          connectionConfig,
          spacingMode,
        });

        setIsSaved(true);
        if (res.lastSavedAt) {
          setLastSavedTime(res.lastSavedAt);
        }

        if (isManual) {
          setSaveToastMsg(`✓ บันทึกผลงานล่าสุดลงเซิร์ฟเวอร์เรียบร้อยแล้ว (${res.lastSavedAt || 'เพิ่งบันทึก'}) • เซฟทับดราฟต์ล่าสุด (เทมเพลตเดิมไม่ถูกทับ)`);
          setTimeout(() => setSaveToastMsg(null), 4000);
        }
      } catch (err) {
        console.warn('Save failed:', err);
      } finally {
        setIsSaving(false);
      }
    },
    [
      currentTeamUser,
      widgets,
      salesData,
      dashboardTitle,
      themeConfig,
      filterState,
      connectionConfig,
      spacingMode,
    ]
  );

  // Mount effect: Sync active unified session across devices/browsers, then fetch their latest saved dashboard
  useEffect(() => {
    let isMounted = true;

    syncSessionFromServer()
      .then((sessionUser) => {
        if (!isMounted) return;
        const targetUser = sessionUser || currentTeamUser;
        if (targetUser?.id) {
          if (sessionUser && sessionUser.id !== currentTeamUser?.id) {
            setCurrentTeamUser(sessionUser);
          }
          loadUserDashboardFromCloud(targetUser.id)
            .then((cloudData) => {
              if (isMounted && cloudData && cloudData.widgets && cloudData.widgets.length > 0) {
                applyDashboardData(cloudData);
              }
            })
            .finally(() => {
              if (isMounted) {
                setTimeout(() => {
                  isPopulatingUserDataRef.current = false;
                }, 300);
              }
            });
        } else {
          isPopulatingUserDataRef.current = false;
        }
      })
      .catch(() => {
        if (currentTeamUser?.id) {
          loadUserDashboardFromCloud(currentTeamUser.id)
            .then((cloudData) => {
              if (isMounted && cloudData && cloudData.widgets && cloudData.widgets.length > 0) {
                applyDashboardData(cloudData);
              }
            })
            .finally(() => {
              if (isMounted) {
                setTimeout(() => {
                  isPopulatingUserDataRef.current = false;
                }, 300);
              }
            });
        } else {
          isPopulatingUserDataRef.current = false;
        }
      });

    // On window focus, check if user session or dashboard was updated on another browser/device
    const handleFocusSync = () => {
      syncSessionFromServer().then((sessionUser) => {
        const u = sessionUser || currentTeamUser;
        if (u?.id && !isPopulatingUserDataRef.current) {
          loadDashboardFromServerFile(u.id).then((serverDash) => {
            if (serverDash && serverDash.widgets && serverDash.widgets.length > 0) {
              if (serverDash.dashboardTitle !== dashboardTitle || serverDash.widgets.length !== widgets.length) {
                applyDashboardData(serverDash);
              }
            }
          }).catch(() => {});
        }
      }).catch(() => {});
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocusSync);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocusSync);
      }
    };
  }, []);

  // Auto-load user's dashboard when logging in or switching account
  const lastLoadedUserIdRef = React.useRef<string | null>(currentTeamUser?.id || null);
  useEffect(() => {
    if (currentTeamUser?.id !== lastLoadedUserIdRef.current) {
      lastLoadedUserIdRef.current = currentTeamUser?.id || null;
      applyUserDashboard(currentTeamUser);
    }
  }, [currentTeamUser?.id, applyUserDashboard]);

  // Debounced Auto-Save upon any change (instant local-first, zero data loss!)
  useEffect(() => {
    if (!currentTeamUser?.id || isPopulatingUserDataRef.current) return;
    setIsSaved(false);
    const timer = setTimeout(() => {
      performSave(false);
    }, 700);

    return () => clearTimeout(timer);
  }, [widgets, salesData, dashboardTitle, themeConfig, filterState, connectionConfig, spacingMode, currentTeamUser?.id, performSave]);

  const handleAdoptTemplate = (template: DashboardTemplate) => {
    setWidgets(template.widgets);
    if (template.salesData && template.salesData.length > 0) {
      setSalesData(template.salesData);
    }
    if (template.themePreset) {
      setThemeConfig((prev) => ({ ...prev, preset: template.themePreset }));
    }
    setDashboardTitle(template.title);
    setSelectedWidgetId(template.widgets[0]?.id || '');
    setIsAssignedTemplatesOpen(false);
  };

  // Compute Active Theme Palettes & Styles
  const themeStyles = useMemo(
    () => getThemeStyles(themeConfig.preset),
    [themeConfig.preset]
  );

  // History Stack for Undo / Redo
  const [history, setHistory] = useState<VisualWidget[][]>([INITIAL_WIDGETS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [copiedWidget, setCopiedWidget] = useState<VisualWidget | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err: any) {
      alert(`Google Sign-In: ${err.message}`);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await googleSignOut();
      setUser(null);
      setAccessToken(null);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Push state to history
  const pushWidgetsState = (newWidgets: VisualWidget[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newWidgets);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setWidgets(newWidgets);
    setIsSaved(true);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setWidgets(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setWidgets(history[nextIndex]);
    }
  };

  // Widget Actions
  const selectedWidget = useMemo(
    () => widgets.find((w) => w.id === selectedWidgetId) || null,
    [widgets, selectedWidgetId]
  );

  const handleUpdateWidget = (id: string, partial: Partial<VisualWidget>) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, ...partial } : w));
    pushWidgetsState(updated);
  };

  const handleDuplicateWidget = (id: string) => {
    const target = widgets.find((w) => w.id === id);
    if (!target) return;
    const newId = `widget-${Date.now()}`;
    const copy: VisualWidget = {
      ...target,
      id: newId,
      title: `${target.title} (สำเนา)`,
      x: (target.x + 1) % 12,
      y: target.y + 1,
    };
    pushWidgetsState([...widgets, copy]);
    setSelectedWidgetId(newId);
  };

  const handleDeleteWidget = (id: string) => {
    const filtered = widgets.filter((w) => w.id !== id);
    pushWidgetsState(filtered);
    if (selectedWidgetId === id) {
      setSelectedWidgetId('');
    }
  };

  const handleCopyWidget = (id: string) => {
    const target = widgets.find((w) => w.id === id);
    if (target) {
      setCopiedWidget(target);
    }
  };

  const handlePasteWidget = () => {
    if (!copiedWidget) return;
    const newId = `widget-${Date.now()}`;
    const pasted: VisualWidget = {
      ...copiedWidget,
      id: newId,
      title: `${copiedWidget.title} (สำเนา)`,
      x: (copiedWidget.x + 2) % 12,
      y: copiedWidget.y + 2,
    };
    pushWidgetsState([...widgets, pasted]);
    setSelectedWidgetId(newId);
  };

  const handleToggleLock = (id: string) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, locked: !w.locked } : w));
    pushWidgetsState(updated);
  };

  const handleToggleHide = (id: string) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, hidden: !w.hidden } : w));
    pushWidgetsState(updated);
  };

  const handleBringForward = (id: string) => {
    const idx = widgets.findIndex((w) => w.id === id);
    if (idx < widgets.length - 1) {
      const reordered = [...widgets];
      const [item] = reordered.splice(idx, 1);
      reordered.push(item);
      pushWidgetsState(reordered);
    }
  };

  const handleSendBackward = (id: string) => {
    const idx = widgets.findIndex((w) => w.id === id);
    if (idx > 0) {
      const reordered = [...widgets];
      const [item] = reordered.splice(idx, 1);
      reordered.unshift(item);
      pushWidgetsState(reordered);
    }
  };

  const handleAddVisual = () => {
    const newId = `chart-${Date.now()}`;
    const newWidget: VisualWidget = {
      id: newId,
      title: 'วิชวลใหม่',
      type: 'bar',
      x: 0,
      y: 10,
      w: 6,
      h: 4,
      metric: 'revenue',
      dimension: 'category',
      showLegend: true,
    };
    pushWidgetsState([...widgets, newWidget]);
    setSelectedWidgetId(newId);
    setInspectorOpen(true);
  };

  const handleAddFloatingText = () => {
    const newId = `text-${Date.now()}`;
    const newWidget: VisualWidget = {
      id: newId,
      title: 'ข้อความลอย',
      type: 'floating_text',
      x: 0,
      y: 10,
      w: 4,
      h: 1,
      config: { text: 'พิมพ์ข้อความที่นี่...' },
    };
    pushWidgetsState([...widgets, newWidget]);
    setSelectedWidgetId(newId);
  };

  const handleAddImage = () => {
    const newId = `img-${Date.now()}`;
    const newWidget: VisualWidget = {
      id: newId,
      title: 'โลโก้ / รูปภาพ',
      type: 'image',
      x: 24,
      y: 24,
      w: 4,
      h: 3,
      customWidth: 260,
      customHeight: 140,
      imageUrl: '',
      imageFit: 'contain',
      showTitle: false,
    };
    pushWidgetsState([...widgets, newWidget]);
    setSelectedWidgetId(newId);
    setInspectorOpen(true);
  };

  const handleAddTable = () => {
    const newId = `table-${Date.now()}`;
    const detectedKeys =
      connectionConfig.detectedHeaders && connectionConfig.detectedHeaders.length > 0
        ? connectionConfig.detectedHeaders
        : ['date', 'region', 'category', 'product', 'revenue', 'profit'];
    const newWidget: VisualWidget = {
      id: newId,
      title: 'ตารางข้อมูลสรุป',
      type: 'table',
      x: 24,
      y: 120,
      w: 10,
      h: 6,
      customWidth: 800,
      customHeight: 380,
      metric: 'revenue',
      dimension: 'product',
      tableColumns: detectedKeys.slice(0, 6),
      tableMode: 'raw',
      tablePageSize: 10,
      tableSearch: true,
      tableShowRowNumbers: true,
      tableSortColumn: detectedKeys[0] || 'date',
      tableSortDirection: 'desc',
      showTitle: true,
    };
    pushWidgetsState([...widgets, newWidget]);
    setSelectedWidgetId(newId);
    setInspectorOpen(true);
  };

  // Add customized Studio shapes (สี่เหลี่ยม, วงกลม, สามเหลี่ยม, ดาว, เพชร, แคปซูล)
  const handleAddShape = (shapeType: VisualType) => {
    const newId = `shape-${Date.now()}`;
    const shapeLabels: Record<string, string> = {
      shape_rect: 'กรอบสี่เหลี่ยม',
      shape_rounded: 'กรอบสี่เหลี่ยมมน',
      shape_circle: 'รูปทรงวงกลม',
      shape_triangle: 'รูปทรงสามเหลี่ยม',
      shape_star: 'รูปทรงดาว',
      shape_diamond: 'รูปทรงเพชร',
      shape_pill: 'รูปทรงแคปซูล',
      shape_banner: 'แถบแบนเนอร์',
    };
    const newWidget: VisualWidget = {
      id: newId,
      title: shapeLabels[shapeType] || 'รูปทรงใหม่',
      type: shapeType,
      x: 0,
      y: 0,
      w: 4,
      h: 3,
      shapeFillColor: '#ede9fe',
      shapeBorderColor: '#8b5cf6',
      shapeBorderWidth: 2,
      shapeBorderStyle: 'solid',
      shapeText: '',
      shapeTextColor: '#5b21b6',
      shapeTextSize: 14,
    };
    pushWidgetsState([...widgets, newWidget]);
    setSelectedWidgetId(newId);
    setInspectorOpen(true);
  };

  // Adjust widget dimensions
  const handleResizeWidget = (id: string, deltaW: number, deltaH: number) => {
    const updated = widgets.map((w) => {
      if (w.id === id) {
        const nextW = Math.max(1, Math.min(12, (w.w || 6) + deltaW));
        const nextH = Math.max(1, Math.min(24, (w.h || 4) + deltaH));
        const updatedCustomHeight = w.customHeight
          ? Math.max(60, w.customHeight + deltaH * 40)
          : undefined;
        return {
          ...w,
          w: nextW,
          h: nextH,
          customHeight: updatedCustomHeight,
        };
      }
      return w;
    });
    pushWidgetsState(updated);
  };

  // Toggle maximize widget to 12 columns
  const handleToggleMaximizeWidget = (id: string) => {
    const target = widgets.find((w) => w.id === id);
    if (!target) return;
    const isMax = target.w === 12;
    const updated = widgets.map((w) => {
      if (w.id === id) {
        return { ...w, w: isMax ? 6 : 12 };
      }
      return w;
    });
    pushWidgetsState(updated);
  };

  // Interactive Cross Filtering (เมื่อคลิกที่กราฟ จะกรองข้อมูลทันทีโดยไม่ต้องเปิดแท็บ)
  const handleCrossFilter = (dimension: string, value: any) => {
    setFilterState((prev) => {
      if (prev.crossFilter?.column === dimension && prev.crossFilter?.value === value) {
        // Toggle off if clicking the same selected value
        return { ...prev, crossFilter: null };
      }
      return {
        ...prev,
        crossFilter: { column: dimension, value },
      };
    });
  };

  const handleUpdateFilterState = (partial: Partial<FilterState>) => {
    setFilterState((prev) => ({ ...prev, ...partial }));
  };

  const handleClearAllFilters = () => {
    setFilterState({
      regions: [],
      categories: [],
      skipBlanks: false,
      crossFilter: null,
      customRules: [],
    });
  };

  // Auto Align layout
  const handleAutoAlign = () => {
    const aligned = widgets.map((w, i) => ({
      ...w,
      x: (i % 2) * 6,
      y: Math.floor(i / 2) * 4,
      w: 6,
      h: 4,
    }));
    pushWidgetsState(aligned);
  };

  // Auto Snap
  const handleAutoSnap = () => {
    const snapped = widgets.map((w) => ({
      ...w,
      x: Math.round(w.x),
      y: Math.round(w.y),
      w: Math.max(2, Math.round(w.w)),
      h: Math.max(2, Math.round(w.h)),
    }));
    pushWidgetsState(snapped);
  };

  // Auto Organize Widgets into an executive, clean dashboard grid
  const handleAutoOrganize = () => {
    const containerW = 1200;
    const organized = autoOrganizeWidgets(widgets, containerW);
    pushWidgetsState(organized);
  };

  // Sync data with Google Sheets using the user's configured Sheet Tab & Row Ranges!
  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      if (connectionConfig.spreadsheetId) {
        // Also refresh metadata to discover all sheet tabs of the link
        try {
          const meta = await fetchSpreadsheetMetadata(connectionConfig.spreadsheetId, accessToken);
          if (meta.sheets && meta.sheets.length > 0) {
            setConnectionConfig((prev) => ({
              ...prev,
              availableSheets: meta.sheets,
              spreadsheetTitle: meta.title || prev.spreadsheetTitle,
            }));
          }
        } catch (e) {
          console.warn('Metadata refresh failed during sync', e);
        }

        const res = await fetchSheetRowsWithConfig(
          connectionConfig.spreadsheetId,
          connectionConfig.sheetName,
          connectionConfig.headerRow || 1,
          connectionConfig.dataStartRow || 2,
          connectionConfig.dataEndRow || undefined,
          accessToken
        );
        if (res.records.length > 0) {
          setSalesData(res.records);
          if (res.headers && res.headers.length > 0) {
            setConnectionConfig((prev) => ({ ...prev, detectedHeaders: res.headers }));
          }
        }
      } else {
        // Built-in sample sync simulation
        await new Promise((r) => setTimeout(r, 500));
      }
      setConnectionConfig((prev) => ({
        ...prev,
        lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      }));
    } catch (err: any) {
      alert(`การซิงค์ข้อมูล Google Sheets: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Snapshot Saving and Restoration
  const handleSaveSnapshot = (title: string) => {
    const newVer: DashboardVersion = {
      id: `ver-${Date.now()}`,
      title,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      widgets,
      salesData,
    };
    setDashboardVersions((prev) => [newVer, ...prev]);
  };

  const handleRestoreVersion = (ver: DashboardVersion) => {
    pushWidgetsState(ver.widgets);
    if (ver.salesData) {
      setSalesData(ver.salesData);
    }
    setDashboardTitle(ver.title);
  };

  // Filter Data dynamically according to FilterState (with Cross-filtering, Skip blanks, Custom rules)
  const filteredSalesData = useMemo(() => {
    return applyGlobalFilters(salesData, filterState);
  }, [salesData, filterState]);

  // Dynamic Theme Styling
  const themeBgClass = useMemo(() => {
    switch (themeConfig.preset) {
      case 'light':
        return 'bg-slate-100 text-slate-900';
      case 'midnight':
        return 'bg-[#090d16] text-slate-100';
      case 'ocean':
        return 'bg-[#071326] text-slate-100';
      case 'forest':
        return 'bg-[#091611] text-slate-100';
      case 'sunset':
        return 'bg-[#170c12] text-slate-100';
      case 'violet':
      default:
        return 'bg-[#141224] text-slate-100';
    }
  }, [themeConfig.preset]);

  const fontStyle = useMemo(() => {
    if (themeConfig.fontFamily === 'system') return {};
    return { fontFamily: `'${themeConfig.fontFamily}', sans-serif` };
  }, [themeConfig.fontFamily]);

  if (viewMode === 'dev_console') {
    // ป้องกันระบบหลังบ้าน: ตรวจสอบสิทธิ์ว่าเป็นผู้ดูแลระบบ (Admin) หรือผ่านรหัสผ่าน Master Passcode หรือไม่
    const isAuthorizedAdmin = currentTeamUser?.role === 'admin' || isAdminAuthenticatedSession();

    if (!isAuthorizedAdmin) {
      return (
        <AdminAccessGate
          onUnlockSuccess={() => {
            setCurrentTeamUser(getCurrentUser());
            setViewMode('dev_console');
          }}
          onBackToUserPortal={() => {
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('portal');
              url.searchParams.delete('mode');
              window.history.pushState({}, '', url.pathname);
            }
            setViewMode('studio');
          }}
        />
      );
    }

    return (
      <AdminPlatform
        onBackToUserPortal={() => {
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('portal');
            url.searchParams.delete('mode');
            window.history.pushState({}, '', url.pathname);
          }
          setViewMode('studio');
        }}
        onOpenViewerPortal={() => {
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('portal', 'viewer');
            window.history.pushState({}, '', url.toString());
          }
          setViewMode('public_viewer');
        }}
        currentWidgets={widgets}
        currentSalesData={salesData}
        onUpdateSalesData={setSalesData}
      />
    );
  }

  if (viewMode === 'public_viewer') {
    // Check if website is closed for maintenance across all systems
    if (!siteStatus.isOnline) {
      return (
        <MaintenanceScreen
          status={siteStatus}
          onRefresh={() => {
            fetchSiteStatusFromServer().then(setSiteStatus);
          }}
        />
      );
    }

    return (
      <PublicViewerPortal
        dashboardTitle={dashboardTitle}
        widgets={widgets.filter((w) => !w.hidden)}
        salesData={filteredSalesData}
        allSalesData={salesData}
        filterState={filterState}
        onUpdateFilterState={handleUpdateFilterState}
        onClearFilters={handleClearAllFilters}
        onCrossFilter={handleCrossFilter}
        themeStyles={themeStyles}
        connectionConfig={connectionConfig}
        onRefreshData={handleSyncData}
        isSyncing={isSyncing}
        sharedByUserName={sharedCreatorName || (currentTeamUser ? currentTeamUser.displayName : undefined)}
        sharedByUserId={currentTeamUser?.id}
        onReturnToStudio={() => {
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('portal');
            url.searchParams.delete('user');
            url.searchParams.delete('dash');
            window.history.pushState({}, '', url.pathname + (url.search ? '?' + url.searchParams.toString() : ''));
          }
          setViewMode('studio');
        }}
      />
    );
  }

  // Studio Portal (User Portal)
  // 1. Master System Shutdown: When website is closed, close it across ALL browsers, devices, and viewers!
  // No backdoor, no bypass link to backend - only displays maintenance information as defined by admin!
  if (!siteStatus.isOnline && viewMode !== 'dev_console') {
    return (
      <MaintenanceScreen
        status={siteStatus}
        onRefresh={() => {
          fetchSiteStatusFromServer().then(setSiteStatus);
        }}
      />
    );
  }

  // 2. Unauthenticated Visitors / First-time Entry:
  // Render the gorgeous Welcome & Step-by-Step Entry Landing Portal!
  // Does not force Admin ID, does not pop up a bare input ID modal. Has 4-step walkthrough and smooth login.
  if (!currentTeamUser && viewMode === 'studio') {
    return (
      <WelcomeLandingPortal
        onLoginSuccess={(user) => {
          setCurrentTeamUser(user);
          applyUserDashboard(user);
        }}
      />
    );
  }

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden antialiased transition-colors duration-200"
      style={{
        ...fontStyle,
        backgroundColor: themeStyles.canvasBg,
      }}
    >
      {/* If site is offline, display admin alert banner ONLY when unlocked by admin */}
      {!siteStatus.isOnline && (adminBypass || currentTeamUser?.role === 'admin') && (
        <div className="bg-gradient-to-r from-rose-900 via-amber-900 to-rose-900 text-white text-xs py-2 px-4 text-center font-bold flex flex-wrap items-center justify-between gap-2 shadow-lg shrink-0 z-50 border-b border-rose-500/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
            <span>⚠️ โหมดผู้ดูแลระบบ: เว็บไซต์ผู้ใช้งานกำลังปิดปรับปรุงชั่วคราว (ผู้ใช้ทั่วไปและผู้ชมจะเข้าไม่ได้)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const updated = toggleSiteOnline(true);
                setSiteStatus(updated);
              }}
              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-extrabold shadow cursor-pointer transition"
            >
              🟢 เปิดเว็บไซต์ให้ผู้ใช้ทันที
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.set('portal', 'admin');
                  window.history.pushState({}, '', url.toString());
                }
                setViewMode('dev_console');
              }}
              className="px-3 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-white text-xs font-semibold cursor-pointer transition border border-white/20"
            >
              🛡️ กลับสู่ระบบแอดมิน
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        widgets={widgets}
        selectedWidgetId={selectedWidgetId}
        onSelectWidget={(id) => {
          setSelectedWidgetId(id);
          if (id) setInspectorOpen(true);
        }}
        onToggleHide={(id, e) => {
          e.stopPropagation();
          handleToggleHide(id);
        }}
        onToggleLock={(id, e) => {
          e.stopPropagation();
          handleToggleLock(id);
        }}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        connectionConfig={connectionConfig}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        onOpenTheme={() => setIsThemeModalOpen(true)}
        onOpenGettingStarted={() => setIsGettingStartedOpen(true)}
        onOpenDataEditor={() => setIsDataEditorOpen(true)}
        onOpenDevConsole={handleOpenAdminPlatform}
        onOpenPublish={() => setIsPublishModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        currentUser={currentTeamUser}
        onOpenTemplatesModal={() => setIsAssignedTemplatesOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleTeamLogout}
        onNewDashboard={() => {
          const freshId = `chart-${Date.now()}`;
          setWidgets([
            {
              id: freshId,
              title: 'ภาพรวมยอดขาย',
              type: 'bar',
              x: 0,
              y: 0,
              w: 12,
              h: 5,
              metric: 'revenue',
              dimension: 'category',
              showLegend: true,
            },
          ]);
          setSelectedWidgetId(freshId);
          setDashboardTitle('แดชบอร์ดใหม่');
        }}
        userEmail={user?.email || 'aoneza953@gmail.com'}
        userDisplayName={user?.displayName || '1234'}
        userPhotoUrl={user?.photoURL || undefined}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={user ? handleGoogleSignOut : undefined}
        recordCount={salesData.length}
        onOpenMyDashboards={() => setIsMyDashboardsOpen(true)}
        onOpenDataSourceStorage={() => setIsDataSourceModalOpen(true)}
        themeStyles={themeStyles}
        isTestRoute={isTestRoute}
        onNavigateToTestPortal={handleNavigateToTestPortal}
        onNavigateToUserPortal={handleNavigateToUserPortal}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* QA Test Lab Banner & Persona Controller - Strictly shown ONLY on /test route */}
        {isTestRoute && (
          <TestLabBar
            currentUser={currentTeamUser}
            onSwitchUser={handleTestQuickSwitchUser}
            onLogout={handleTeamLogout}
            onNavigateToUserPortal={handleNavigateToUserPortal}
            onNavigateToDevAdmin={handleNavigateToDevAdmin}
            recordCount={salesData.length}
            widgetCount={widgets.length}
          />
        )}

        {/* Central Announcement Banner from Admin CMS */}
        {siteStatus.cmsSettings?.bannerEnabled && siteStatus.cmsSettings?.bannerMessage && (
          <div
            className={`px-4 py-1.5 text-xs font-medium text-center flex items-center justify-center gap-2 border-b shrink-0 ${
              siteStatus.cmsSettings.bannerType === 'warning'
                ? 'bg-amber-950/80 text-amber-200 border-amber-500/30'
                : siteStatus.cmsSettings.bannerType === 'success'
                ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/30'
                : 'bg-violet-950/80 text-violet-200 border-violet-500/30'
            }`}
          >
            <span>📢 {siteStatus.cmsSettings.bannerMessage}</span>
          </div>
        )}

        {/* Top Bar Header & Action Ribbon */}
        <TopBar
          dashboardTitle={dashboardTitle}
          onUpdateTitle={setDashboardTitle}
          isSaved={isSaved}
          isSaving={isSaving}
          lastSavedAt={lastSavedTime}
          onSaveDashboard={() => performSave(true)}
          onExportFile={() => {
            exportDashboardToFile({
              widgets,
              salesData,
              dashboardTitle,
              themeConfig,
              filterState,
              connectionConfig,
              spacingMode,
              lastSavedAt: lastSavedTime || new Date().toLocaleTimeString('th-TH'),
            });
          }}
          onImportFile={(file) => {
            importDashboardFromFile(file)
              .then((imported) => {
                applyDashboardData(imported);
                if (currentTeamUser?.id) {
                  saveUserDashboard(currentTeamUser.id, imported);
                }
              })
              .catch((err) => {
                console.warn('Import error', err);
              });
          }}
          isSyncing={isSyncing}
          onSync={handleSyncData}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onOpenHistory={() => setIsVersionModalOpen(true)}
          onOpenTheme={() => setIsThemeModalOpen(true)}
          onAddVisual={handleAddVisual}
          onAddFloatingText={handleAddFloatingText}
          onAddImage={handleAddImage}
          onAddTable={handleAddTable}
          onOpenDevConsole={handleOpenAdminPlatform}
          onOpenPublish={() => setIsPublishModalOpen(true)}
          onOpenNotifications={() => setIsNotificationsModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          currentUser={currentTeamUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={handleTeamLogout}
          onOpenTemplatesModal={() => setIsAssignedTemplatesOpen(true)}
          onSwitchToViewer={() => {
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.set('portal', 'viewer');
              window.history.pushState({}, '', url.pathname + '?' + url.searchParams.toString());
            }
            setViewMode('public_viewer');
          }}
          onOpenFilter={() => {
            const el = document.getElementById('inline-filter-bar');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          onCreateDraft={() => {
            handleSaveSnapshot(`แบบร่าง ${new Date().toLocaleTimeString('th-TH')}`);
            alert('สร้างแบบร่างและบันทึกสแนปช็อตเรียบร้อยแล้ว');
          }}
          onOpenDataEditor={() => setIsDataEditorOpen(true)}
          onOpenConnectSheet={() => setIsConnectModalOpen(true)}
          inspectorOpen={inspectorOpen}
          onToggleInspector={() => setInspectorOpen((prev) => !prev)}
          filterState={filterState}
          onClearFilters={() => setFilterState({ regions: [], categories: [], rules: [] })}
          onToggleRegionFilter={(reg) => {
            setFilterState((prev) => ({
              ...prev,
              regions: prev.regions.includes(reg)
                ? prev.regions.filter((r) => r !== reg)
                : [...prev.regions, reg],
            }));
          }}
          onToggleCategoryFilter={(cat) => {
            setFilterState((prev) => ({
              ...prev,
              categories: prev.categories.includes(cat)
                ? prev.categories.filter((c) => c !== cat)
                : [...prev.categories, cat],
            }));
          }}
          isPreviewMode={isPreviewMode}
          onTogglePreview={() => setIsPreviewMode((prev) => !prev)}
          onAutoAlign={handleAutoAlign}
          onAutoSnap={handleAutoSnap}
          onAutoOrganize={handleAutoOrganize}
          currentThemePreset={themeConfig.preset}
          onAddShape={handleAddShape}
          spacingMode={spacingMode}
          onSpacingChange={setSpacingMode}
          themeStyles={themeStyles}
          isTestRoute={isTestRoute}
          dashboardId={initialUserDash?.dashboardId || (currentTeamUser ? `dash-${currentTeamUser.id}` : 'dash-main')}
        />

        {/* Floating Real-time Save Confirmation Banner */}
        {saveToastMsg && (
          <div className="absolute top-16 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/95 border border-emerald-400 text-emerald-200 text-xs font-semibold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{saveToastMsg}</span>
          </div>
        )}

        {/* Central Visual Canvas */}
        <div className="flex-1 flex overflow-hidden relative">
          <Canvas
            widgets={widgets.filter((w) => !w.hidden)}
            selectedWidgetId={selectedWidgetId}
            onSelectWidget={(id) => {
              setSelectedWidgetId(id);
              if (id) setInspectorOpen(true);
            }}
            onDeleteWidget={handleDeleteWidget}
            onUpdateWidget={handleUpdateWidget}
            onResizeWidget={handleResizeWidget}
            onToggleMaximizeWidget={handleToggleMaximizeWidget}
            salesData={filteredSalesData}
            allSalesData={salesData}
            filterState={filterState}
            onUpdateFilterState={handleUpdateFilterState}
            onClearFilters={handleClearAllFilters}
            onCrossFilter={handleCrossFilter}
            onAddVisual={handleAddVisual}
            onAddShape={handleAddShape}
            isPreviewMode={isPreviewMode}
            spacingMode={spacingMode}
            detectedHeaders={connectionConfig.detectedHeaders}
            themeStyles={themeStyles}
            onReorderWidgets={pushWidgetsState}
            onAutoOrganize={handleAutoOrganize}
          />

          {/* Right Inspector Panel */}
          {inspectorOpen && !isPreviewMode && (
            <Inspector
              widget={selectedWidget}
              onClose={() => setInspectorOpen(false)}
              onUpdateWidget={handleUpdateWidget}
              onDuplicateWidget={handleDuplicateWidget}
              onDeleteWidget={handleDeleteWidget}
              onCopyWidget={handleCopyWidget}
              onPasteWidget={handlePasteWidget}
              onToggleLock={handleToggleLock}
              onToggleHide={handleToggleHide}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
              detectedHeaders={connectionConfig.detectedHeaders}
              salesData={salesData}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <DataEditorModal
        isOpen={isDataEditorOpen}
        onClose={() => setIsDataEditorOpen(false)}
        salesData={salesData}
        datasetTitle={connectionConfig.spreadsheetTitle || dashboardTitle}
        connectionConfig={connectionConfig}
        onRefreshFromSheet={handleSyncData}
        isSyncing={isSyncing}
        onOpenDataSourceStorage={() => setIsDataSourceModalOpen(true)}
        onSaveData={(newData) => {
          setSalesData(newData);
          if (newData && newData.length > 0) {
            const detectedKeys = Object.keys(newData[0]).filter((k) => k !== 'id');
            setConnectionConfig((prev) => ({
              ...prev,
              detectedHeaders: detectedKeys.length > 0 ? detectedKeys : prev.detectedHeaders,
              lastSyncedAt: new Date().toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }));
          } else {
            setConnectionConfig((prev) => ({
              ...prev,
              lastSyncedAt: new Date().toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }));
          }
        }}
      />

      {/* Data Source Storage Modal (Requirement 5) */}
      <DataSourceModal
        isOpen={isDataSourceModalOpen}
        onClose={() => setIsDataSourceModalOpen(false)}
        currentUser={currentTeamUser}
        currentSalesData={salesData}
        onSelectDataSource={(records, name) => {
          setSalesData(records);
          setConnectionConfig((prev) => ({
            ...prev,
            spreadsheetTitle: name,
            lastSyncedAt: new Date().toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          }));
        }}
      />

      <ConnectSheetModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        config={connectionConfig}
        onUpdateConfig={setConnectionConfig}
        user={user}
        accessToken={accessToken}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleGoogleSignOut}
        salesData={salesData}
        onOpenDataEditor={() => setIsDataEditorOpen(true)}
        onImportData={(importedRecords, title, detectedHeaders) => {
          setSalesData(importedRecords);
          setDashboardTitle(title);
          if (detectedHeaders && detectedHeaders.length > 0) {
            setConnectionConfig((prev) => ({ ...prev, detectedHeaders }));
          }
        }}
      />

      <GettingStartedModal
        isOpen={isGettingStartedOpen}
        onClose={() => setIsGettingStartedOpen(false)}
        onOpenConnectSheet={() => setIsConnectModalOpen(true)}
        onOpenTheme={() => setIsThemeModalOpen(true)}
      />

      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        themeConfig={themeConfig}
        onUpdateTheme={setThemeConfig}
      />

      <VersionHistoryModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        versions={dashboardVersions}
        onSaveSnapshot={handleSaveSnapshot}
        onRestoreVersion={handleRestoreVersion}
      />

      {/* My Dashboards Collection Modal (Requirements 3, 4, 6, 8) */}
      <MyDashboardsModal
        isOpen={isMyDashboardsOpen}
        onClose={() => setIsMyDashboardsOpen(false)}
        currentWidgets={widgets}
        currentSalesData={salesData}
        currentThemePreset={themeConfig.preset}
        currentDashboardTitle={dashboardTitle}
        currentUser={currentTeamUser}
        currentThemeConfig={themeConfig}
        currentFilterState={filterState}
        currentConnectionConfig={connectionConfig}
        currentSpacingMode={spacingMode}
        onLoadDashboard={(loadedWidgets, loadedData, loadedTheme, loadedTitle, loadedFilterState, loadedConnectionConfig) => {
          setWidgets(loadedWidgets);
          setSalesData(loadedData);
          if (loadedTheme) {
            setThemeConfig((prev) => ({ ...prev, preset: loadedTheme as any }));
          }
          if (loadedTitle) {
            setDashboardTitle(loadedTitle);
          }
          if (loadedFilterState) {
            setFilterState(loadedFilterState);
          }
          if (loadedConnectionConfig) {
            setConnectionConfig(loadedConnectionConfig);
          }
          setSelectedWidgetId(loadedWidgets[0]?.id || '');
        }}
        onSaveCurrentDashboard={() => performSave(false)}
      />

      {/* Team Authentication Modal (Login / Register / Account Switch) */}
      <AuthModal
        isOpen={isAuthModalOpen || !currentTeamUser}
        forceAuth={!currentTeamUser}
        initialMode="login"
        isTestMode={isTestRoute}
        onClose={() => {
          if (currentTeamUser) {
            setIsAuthModalOpen(false);
          }
        }}
        onLoginSuccess={(teamUser) => {
          setCurrentTeamUser(teamUser);
          applyUserDashboard(teamUser);
          setIsAuthModalOpen(false);
        }}
      />

      {/* Assigned Templates Modal (View & adopt templates sent by Admin) */}
      <AssignedTemplatesModal
        isOpen={isAssignedTemplatesOpen}
        onClose={() => setIsAssignedTemplatesOpen(false)}
        currentUserId={currentTeamUser?.id || 'all'}
        onSelectTemplate={handleAdoptTemplate}
      />

      {/* User Portal: เผยแพร่ & แชร์ลิงก์สำหรับผู้ชม (Publish & Share Viewer Link) */}
      <UserPublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        dashboardTitle={dashboardTitle}
        currentUser={currentTeamUser}
        dashboardId={initialUserDash?.dashboardId || (currentTeamUser ? `dash-${currentTeamUser.id}` : 'dash-main')}
        onSaveBeforeShare={() => performSave(false)}
        onPreviewViewer={() => {
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('portal', 'viewer');
            if (currentTeamUser?.id) {
              url.searchParams.set('user', currentTeamUser.id);
            }
            window.history.pushState({}, '', url.toString());
          }
          setViewMode('public_viewer');
        }}
      />

      {/* User Portal: ข้อมูลโปรไฟล์และรหัสผ่าน (User Profile & API Key) */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentTeamUser}
        onUpdateUser={(updated) => {
          if (currentTeamUser) {
            setCurrentTeamUser({ ...currentTeamUser, ...updated });
          }
        }}
      />

      {/* User Portal: ตั้งค่าการแจ้งเตือน (Notifications Modal) */}
      <UserNotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />
      </div>
    </div>
  );
}
