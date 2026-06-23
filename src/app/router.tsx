import { lazy, Suspense, type ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute, GuestRoute } from '@/components/shared/ProtectedRoute'
import { ActiveAccountRoute, PendingAccountRoute } from '@/components/shared/AccountStatusGate'
import {
  MustChangePasswordRoute,
  RequirePasswordChangeDone,
} from '@/components/shared/MustChangePasswordGate'
import { RoleGuard } from '@/components/shared/RoleGuard'
import { PageLoader } from '@/components/shared/PageLoader'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'

function S({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

const FeedPage = lazy(() =>
  import('@/features/forum/pages/FeedPage').then((m) => ({ default: m.FeedPage })),
)
const ForumPage = lazy(() =>
  import('@/features/forum/pages/ForumPage').then((m) => ({ default: m.ForumPage })),
)
const PostDetailPage = lazy(() =>
  import('@/features/forum/pages/PostDetailPage').then((m) => ({ default: m.PostDetailPage })),
)
const CreatePostPage = lazy(() =>
  import('@/features/forum/pages/CreatePostPage').then((m) => ({ default: m.CreatePostPage })),
)
const EditPostPage = lazy(() =>
  import('@/features/forum/pages/EditPostPage').then((m) => ({ default: m.EditPostPage })),
)
const AlertsPage = lazy(() =>
  import('@/features/alerts/pages/AlertsPage').then((m) => ({ default: m.AlertsPage })),
)
const AlertDetailPage = lazy(() =>
  import('@/features/alerts/pages/AlertDetailPage').then((m) => ({ default: m.AlertDetailPage })),
)
const CreateAlertPage = lazy(() =>
  import('@/features/alerts/pages/CreateAlertPage').then((m) => ({ default: m.CreateAlertPage })),
)
const MyAlertsPage = lazy(() =>
  import('@/features/alerts/pages/MyAlertsPage').then((m) => ({ default: m.MyAlertsPage })),
)
const ResourcesPage = lazy(() =>
  import('@/features/resources/pages/ResourcesPage').then((m) => ({ default: m.ResourcesPage })),
)
const ResourceDetailPage = lazy(() =>
  import('@/features/resources/pages/ResourceDetailPage').then((m) => ({
    default: m.ResourceDetailPage,
  })),
)
const CreateResourcePage = lazy(() =>
  import('@/features/resources/pages/CreateResourcePage').then((m) => ({
    default: m.CreateResourcePage,
  })),
)
const MyResourcesPage = lazy(() =>
  import('@/features/resources/pages/MyResourcesPage').then((m) => ({
    default: m.MyResourcesPage,
  })),
)
const EditResourcePage = lazy(() =>
  import('@/features/resources/pages/EditResourcePage').then((m) => ({
    default: m.EditResourcePage,
  })),
)
const ModerationLayout = lazy(() =>
  import('@/features/moderation/components/ModerationLayout').then((m) => ({
    default: m.ModerationLayout,
  })),
)
const ModerationDashboardPage = lazy(() =>
  import('@/features/moderation/pages/ModerationDashboardPage').then((m) => ({
    default: m.ModerationDashboardPage,
  })),
)
const ModerationAlertsPage = lazy(() =>
  import('@/features/moderation/pages/ModerationAlertsPage').then((m) => ({
    default: m.ModerationAlertsPage,
  })),
)
const ModerationResourcesPage = lazy(() =>
  import('@/features/moderation/pages/ModerationResourcesPage').then((m) => ({
    default: m.ModerationResourcesPage,
  })),
)
const ModerationPostsPage = lazy(() =>
  import('@/features/moderation/pages/ModerationPostsPage').then((m) => ({
    default: m.ModerationPostsPage,
  })),
)
const ModerationCommentsPage = lazy(() =>
  import('@/features/moderation/pages/ModerationCommentsPage').then((m) => ({
    default: m.ModerationCommentsPage,
  })),
)
const ModerationReportsPage = lazy(() =>
  import('@/features/moderation/pages/ModerationReportsPage').then((m) => ({
    default: m.ModerationReportsPage,
  })),
)
const AdminLayout = lazy(() =>
  import('@/features/admin/components/AdminLayout').then((m) => ({ default: m.AdminLayout })),
)
const AdminDashboardPage = lazy(() =>
  import('@/features/admin/pages/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
)
const AdminUsersPage = lazy(() =>
  import('@/features/admin/pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
)
const AdminCitiesPage = lazy(() =>
  import('@/features/admin/pages/AdminCitiesPage').then((m) => ({ default: m.AdminCitiesPage })),
)
const AdminResourcesPage = lazy(() =>
  import('@/features/admin/pages/AdminResourcesPage').then((m) => ({
    default: m.AdminResourcesPage,
  })),
)
const MembersPage = lazy(() =>
  import('@/features/profile/pages/MembersPage').then((m) => ({ default: m.MembersPage })),
)
const ProfilePage = lazy(() =>
  import('@/features/profile/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)
const EditProfilePage = lazy(() =>
  import('@/features/profile/pages/EditProfilePage').then((m) => ({ default: m.EditProfilePage })),
)
const SettingsPage = lazy(() =>
  import('@/features/profile/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const ChatPage = lazy(() =>
  import('@/features/chat/pages/ChatPage').then((m) => ({ default: m.ChatPage })),
)
const NotificationsPage = lazy(() =>
  import('@/features/notifications/pages/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
)
const BookmarksPage = lazy(() =>
  import('@/features/bookmarks/pages/BookmarksPage').then((m) => ({ default: m.BookmarksPage })),
)
const PendingAccountPage = lazy(() =>
  import('@/features/auth/pages/PendingAccountPage').then((m) => ({
    default: m.PendingAccountPage,
  })),
)
const ChangePasswordRequiredPage = lazy(() =>
  import('@/features/auth/pages/ChangePasswordRequiredPage').then((m) => ({
    default: m.ChangePasswordRequiredPage,
  })),
)

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/feed" replace />} />

      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MustChangePasswordRoute />}>
          <Route
            path="/cambiar-password-obligatorio"
            element={<S><ChangePasswordRequiredPage /></S>}
          />
        </Route>
        <Route element={<RequirePasswordChangeDone />}>
        <Route
          path="/cuenta-pendiente"
          element={
            <PendingAccountRoute>
              <S><PendingAccountPage /></S>
            </PendingAccountRoute>
          }
        />
        <Route element={<ActiveAccountRoute />}>
        <Route element={<AppShell />}>
        <Route path="/feed" element={<S><FeedPage /></S>} />
        <Route path="/forum" element={<S><ForumPage /></S>} />
        <Route path="/forum/new" element={<S><CreatePostPage /></S>} />
        <Route path="/forum/:postId/edit" element={<S><EditPostPage /></S>} />
        <Route path="/forum/:postId" element={<S><PostDetailPage /></S>} />
        <Route path="/alerts" element={<S><AlertsPage /></S>} />
        <Route path="/alerts/new" element={<S><CreateAlertPage /></S>} />
        <Route path="/alerts/mine" element={<S><MyAlertsPage /></S>} />
        <Route path="/alerts/:alertId" element={<S><AlertDetailPage /></S>} />
        <Route path="/resources" element={<S><ResourcesPage /></S>} />
        <Route path="/resources/new" element={<S><CreateResourcePage /></S>} />
        <Route path="/resources/mine" element={<S><MyResourcesPage /></S>} />
        <Route path="/resources/:resourceId/edit" element={<S><EditResourcePage /></S>} />
        <Route path="/resources/:resourceId" element={<S><ResourceDetailPage /></S>} />
        <Route path="/chat" element={<S><ChatPage /></S>} />
        <Route path="/chat/:conversationId" element={<S><ChatPage /></S>} />
        <Route path="/notifications" element={<S><NotificationsPage /></S>} />
        <Route path="/bookmarks" element={<S><BookmarksPage /></S>} />
        <Route path="/members" element={<S><MembersPage /></S>} />
        <Route
          path="/moderation"
          element={
            <RoleGuard roles={['moderator', 'admin']}>
              <S><ModerationLayout /></S>
            </RoleGuard>
          }
        >
          <Route index element={<S><ModerationDashboardPage /></S>} />
          <Route path="alerts" element={<S><ModerationAlertsPage /></S>} />
          <Route path="resources" element={<S><ModerationResourcesPage /></S>} />
          <Route path="posts" element={<S><ModerationPostsPage /></S>} />
          <Route path="comments" element={<S><ModerationCommentsPage /></S>} />
          <Route path="reports" element={<S><ModerationReportsPage /></S>} />
        </Route>
        <Route
          path="/admin"
          element={
            <RoleGuard roles={['admin']}>
              <S><AdminLayout /></S>
            </RoleGuard>
          }
        >
          <Route index element={<S><AdminDashboardPage /></S>} />
          <Route path="users" element={<S><AdminUsersPage /></S>} />
          <Route path="cities" element={<S><AdminCitiesPage /></S>} />
          <Route path="resources" element={<S><AdminResourcesPage /></S>} />
        </Route>
        <Route path="/profile/edit" element={<S><EditProfilePage /></S>} />
        <Route path="/profile/:alias" element={<S><ProfilePage /></S>} />
        <Route path="/settings" element={<S><SettingsPage /></S>} />
        </Route>
        </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
  )
}
