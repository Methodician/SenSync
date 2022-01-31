import { Component, OnInit } from '@angular/core';
import { Database, ref, listVal } from '@angular/fire/database';
import { Observable } from 'rxjs';

@Component({
  selector: 'sen-module-list',
  templateUrl: './module-list.component.html',
  styleUrls: ['./module-list.component.scss'],
})
export class ModuleListComponent implements OnInit {
  modules$: Observable<any>;

  constructor(db: Database) {
    const node = ref(db, 'modules');
    this.modules$ = listVal(node);
  }

  ngOnInit(): void {}
}
