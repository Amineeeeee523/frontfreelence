import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import { TinderHomeComponent } from './auth/tinder-home/tinder-home.component';
import { NjarebComponent } from './auth/njareb/njareb.component';

import { AuthGuard } from './guards/auth.guard';
import { FreelanceGuard } from './guards/freelance.guard';
import { ClientGuard } from './guards/client.guard';

import { DashboardfreelencerComponent } from './freelencer/dashboardfreelencer/dashboardfreelencer.component';
import { SwipefreelencerComponent } from './freelencer/swipefreelencer/swipefreelencer.component';
import { ChattingfreelencerComponent } from './freelencer/chattingfreelencer/chattingfreelencer.component';
import { MissionfreelencerComponent } from './freelencer/missionfreelencer/missionfreelencer.component';
import { ProfilefreelencerComponent } from './freelencer/profilefreelencer/profilefreelencer.component';
import { FreelencerLayoutComponent } from './freelencer/freelencer-layout/freelencer-layout.component';

import { ClientLayoutComponent } from './client/client-layout/client-layout.component';
import { DashboardclientComponent } from './client/dashboardclient/dashboardclient.component';
import { MissionsclientComponent } from './client/missionsclient/missionsclient.component';
import { FreelenncersintresetedComponent } from './client/freelenncersintreseted/freelenncersintreseted.component';
import { SwipeclientComponent } from './client/swipeclient/swipeclient.component';
import { MessageriedclientComponent } from './client/messageriedclient/messageriedclient.component';
import { SuiviprojetclientComponent } from './client/suiviprojetclient/suiviprojetclient.component';
import { PaiementclientComponent } from './client/paiementclient/paiementclient.component';
import { PaiementMissionDetailComponent } from './client/paiement-mission-detail/paiement-mission-detail.component';


export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'sign-up', component: SignUpComponent },
    { path: 'home', component: TinderHomeComponent },
    { path: 'njareb', component: NjarebComponent },

    {
        path: 'freelencer',
        component: FreelencerLayoutComponent,
        canActivate: [AuthGuard, FreelanceGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: DashboardfreelencerComponent },
            { path: 'swipe', component: SwipefreelencerComponent },
            { path: 'chat', component: ChattingfreelencerComponent },
            { path: 'projects', component: MissionfreelencerComponent },
            { path: 'profile', component: ProfilefreelencerComponent },
        ]
    },

    {
        path: 'client',
        component: ClientLayoutComponent,
        canActivate: [AuthGuard, ClientGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: DashboardclientComponent },
            { path: 'mes-missions', component: MissionsclientComponent },
            { path: 'freelances-interesses', component: FreelenncersintresetedComponent },
            { path: 'explorer-freelances', component: SwipeclientComponent },
            { path: 'messagerie', component: MessageriedclientComponent },
            { path: 'suivi-projet', component: SuiviprojetclientComponent },
            { path: 'paiements', component: PaiementclientComponent },
            { path: 'paiements/mission/:id', component: PaiementMissionDetailComponent },
            { path: 'aide', component: NjarebComponent }, // Using Njareb as a placeholder
        ]
    },

    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: '**', redirectTo: '/home' }
];
