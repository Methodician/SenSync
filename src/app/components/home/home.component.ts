import { Component, OnInit } from '@angular/core';
import { Database, ref, listVal } from '@angular/fire/database';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ModuleI } from 'src/app/models';

@Component({
  selector: 'sen-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  modules$: Observable<ModuleI[] | null>;

  constructor(db: Database, private router: Router) {
    const node = ref(db, 'modules');
    this.modules$ = listVal<ModuleI>(node, { keyField: 'id' });
  }

  ngOnInit(): void {}

  moduleClick = (moduleId: string) =>
    this.router.navigate(['modules', moduleId]);
}
