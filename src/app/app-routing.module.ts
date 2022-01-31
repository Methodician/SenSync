import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ModuleListComponent } from './components/module-list/module-list.component';
import { ModuleOverviewComponent } from './components/module-overview/module-overview.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'modules', component: ModuleListComponent },
  { path: 'modules/:id', component: ModuleOverviewComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
