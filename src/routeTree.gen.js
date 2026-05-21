/* eslint-disable */
// @ts-nocheck
// noinspection JSUnusedGlobalSymbols
// This file is hand-maintained as the route tree the app imports (see router.jsx).
// Detail routes are registered at the root so they render standalone instead of
// nesting inside their list page (which has no <Outlet/>).
import { Route as rootRouteImport } from './routes/__root';
import { Route as SprintsRouteImport } from './routes/sprints';
import { Route as SpacesRouteImport } from './routes/spaces';
import { Route as SocialRouteImport } from './routes/social';
import { Route as SettingsRouteImport } from './routes/settings';
import { Route as RoomsRouteImport } from './routes/rooms';
import { Route as RegisterRouteImport } from './routes/register';
import { Route as NotificationsRouteImport } from './routes/notifications';
import { Route as LoginRouteImport } from './routes/login';
import { Route as FocusRouteImport } from './routes/focus';
import { Route as DomainsRouteImport } from './routes/domains';
import { Route as CalendarRouteImport } from './routes/calendar';
import { Route as BoardRouteImport } from './routes/board';
import { Route as BacklogRouteImport } from './routes/backlog';
import { Route as AnalyticsRouteImport } from './routes/analytics';
import { Route as IndexRouteImport } from './routes/index';
import { Route as TasksIdRouteImport } from './routes/tasks.$id';
import { Route as SprintsIdRouteImport } from './routes/sprints.$id';
import { Route as RoomsIdRouteImport } from './routes/rooms.$id';
import { Route as ProfileUidRouteImport } from './routes/profile.$uid';
import { Route as DomainsIdRouteImport } from './routes/domains.$id';
import { Route as SpacesSpaceIdRouteImport } from './routes/spaces.$spaceId';
import { Route as SpacesSpaceIdSummaryRouteImport } from './routes/spaces.$spaceId.summary';
import { Route as SpacesSpaceIdBoardRouteImport } from './routes/spaces.$spaceId.board';
import { Route as SpacesSpaceIdBacklogRouteImport } from './routes/spaces.$spaceId.backlog';
import { Route as SpacesSpaceIdMembersRouteImport } from './routes/spaces.$spaceId.members';
const SprintsRoute = SprintsRouteImport.update({
    id: '/sprints',
    path: '/sprints',
    getParentRoute: () => rootRouteImport,
});
const SpacesRoute = SpacesRouteImport.update({
    id: '/spaces',
    path: '/spaces',
    getParentRoute: () => rootRouteImport,
});
const SocialRoute = SocialRouteImport.update({
    id: '/social',
    path: '/social',
    getParentRoute: () => rootRouteImport,
});
const SettingsRoute = SettingsRouteImport.update({
    id: '/settings',
    path: '/settings',
    getParentRoute: () => rootRouteImport,
});
const RoomsRoute = RoomsRouteImport.update({
    id: '/rooms',
    path: '/rooms',
    getParentRoute: () => rootRouteImport,
});
const RegisterRoute = RegisterRouteImport.update({
    id: '/register',
    path: '/register',
    getParentRoute: () => rootRouteImport,
});
const NotificationsRoute = NotificationsRouteImport.update({
    id: '/notifications',
    path: '/notifications',
    getParentRoute: () => rootRouteImport,
});
const LoginRoute = LoginRouteImport.update({
    id: '/login',
    path: '/login',
    getParentRoute: () => rootRouteImport,
});
const FocusRoute = FocusRouteImport.update({
    id: '/focus',
    path: '/focus',
    getParentRoute: () => rootRouteImport,
});
const DomainsRoute = DomainsRouteImport.update({
    id: '/domains',
    path: '/domains',
    getParentRoute: () => rootRouteImport,
});
const CalendarRoute = CalendarRouteImport.update({
    id: '/calendar',
    path: '/calendar',
    getParentRoute: () => rootRouteImport,
});
const BoardRoute = BoardRouteImport.update({
    id: '/board',
    path: '/board',
    getParentRoute: () => rootRouteImport,
});
const BacklogRoute = BacklogRouteImport.update({
    id: '/backlog',
    path: '/backlog',
    getParentRoute: () => rootRouteImport,
});
const AnalyticsRoute = AnalyticsRouteImport.update({
    id: '/analytics',
    path: '/analytics',
    getParentRoute: () => rootRouteImport,
});
const IndexRoute = IndexRouteImport.update({
    id: '/',
    path: '/',
    getParentRoute: () => rootRouteImport,
});
const TasksIdRoute = TasksIdRouteImport.update({
    id: '/tasks/$id',
    path: '/tasks/$id',
    getParentRoute: () => rootRouteImport,
});
const SprintsIdRoute = SprintsIdRouteImport.update({
    id: '/sprints/$id',
    path: '/sprints/$id',
    getParentRoute: () => rootRouteImport,
});
const RoomsIdRoute = RoomsIdRouteImport.update({
    id: '/rooms/$id',
    path: '/rooms/$id',
    getParentRoute: () => rootRouteImport,
});
const ProfileUidRoute = ProfileUidRouteImport.update({
    id: '/profile/$uid',
    path: '/profile/$uid',
    getParentRoute: () => rootRouteImport,
});
const DomainsIdRoute = DomainsIdRouteImport.update({
    id: '/domains/$id',
    path: '/domains/$id',
    getParentRoute: () => rootRouteImport,
});
const SpacesSpaceIdRoute = SpacesSpaceIdRouteImport.update({
    id: '/spaces/$spaceId',
    path: '/spaces/$spaceId',
    getParentRoute: () => rootRouteImport,
});
const SpacesSpaceIdSummaryRoute = SpacesSpaceIdSummaryRouteImport.update({
    id: '/spaces/$spaceId/summary',
    path: '/spaces/$spaceId/summary',
    getParentRoute: () => rootRouteImport,
});
const SpacesSpaceIdBoardRoute = SpacesSpaceIdBoardRouteImport.update({
    id: '/spaces/$spaceId/board',
    path: '/spaces/$spaceId/board',
    getParentRoute: () => rootRouteImport,
});
const SpacesSpaceIdBacklogRoute = SpacesSpaceIdBacklogRouteImport.update({
    id: '/spaces/$spaceId/backlog',
    path: '/spaces/$spaceId/backlog',
    getParentRoute: () => rootRouteImport,
});
const SpacesSpaceIdMembersRoute = SpacesSpaceIdMembersRouteImport.update({
    id: '/spaces/$spaceId/members',
    path: '/spaces/$spaceId/members',
    getParentRoute: () => rootRouteImport,
});
const rootRouteChildren = {
    IndexRoute: IndexRoute,
    AnalyticsRoute: AnalyticsRoute,
    BacklogRoute: BacklogRoute,
    BoardRoute: BoardRoute,
    CalendarRoute: CalendarRoute,
    DomainsRoute: DomainsRoute,
    DomainsIdRoute: DomainsIdRoute,
    FocusRoute: FocusRoute,
    LoginRoute: LoginRoute,
    NotificationsRoute: NotificationsRoute,
    RegisterRoute: RegisterRoute,
    RoomsRoute: RoomsRoute,
    RoomsIdRoute: RoomsIdRoute,
    SettingsRoute: SettingsRoute,
    SocialRoute: SocialRoute,
    SpacesRoute: SpacesRoute,
    SpacesSpaceIdRoute: SpacesSpaceIdRoute,
    SpacesSpaceIdSummaryRoute: SpacesSpaceIdSummaryRoute,
    SpacesSpaceIdBoardRoute: SpacesSpaceIdBoardRoute,
    SpacesSpaceIdBacklogRoute: SpacesSpaceIdBacklogRoute,
    SpacesSpaceIdMembersRoute: SpacesSpaceIdMembersRoute,
    SprintsRoute: SprintsRoute,
    SprintsIdRoute: SprintsIdRoute,
    TasksIdRoute: TasksIdRoute,
    ProfileUidRoute: ProfileUidRoute,
};
export const routeTree = rootRouteImport
    ._addFileChildren(rootRouteChildren)
    ._addFileTypes();
