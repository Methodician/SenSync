import { Component, OnInit } from '@angular/core';
import { Database, ref, listVal } from '@angular/fire/database';
import { Observable } from 'rxjs';

@Component({
  selector: 'sen-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  modules$: Observable<any>;

  constructor(db: Database) {
    const node = ref(db, 'modules');
    this.modules$ = listVal(node, { keyField: 'id' });
    this.modules$.subscribe(console.log);
  }

  ngOnInit(): void {}
}
