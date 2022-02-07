import { Component, OnInit } from '@angular/core';
// import { Database, ref, listVal } from '@angular/fire/database';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Router } from '@angular/router';
import { EChartsOption } from 'echarts';
import { map, Observable } from 'rxjs';
import { ModuleI, ReadoutI } from 'src/app/models';

@Component({
  selector: 'sen-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  modules$: Observable<ModuleI[] | null>;
  // chartOptions$: Observable<EChartsOption>;
  readouts$: Observable<any>;

  constructor(db: AngularFireDatabase, private router: Router) {
    const modulesNode = db.list<ModuleI>('modules');
    this.modules$ = modulesNode.snapshotChanges().pipe(
      map(changes =>
        changes.map(
          change =>
            ({
              id: change.payload.key,
              ...change.payload.val(),
            } as ModuleI),
        ),
      ),
    );
    // modular
    // const modulesNode = ref(db, 'modules');
    // this.modules$ = listVal<ModuleI>(modulesNode, { keyField: 'id' });

    const readoutsNode = db.list<ReadoutI>('readouts', ref =>
      ref.orderByChild('timestamp').limitToLast(5),
    );
    this.readouts$ = readoutsNode.snapshotChanges().pipe(
      map(
        changes =>
          changes.map(change => {
            const { key } = change.payload;
            const readout = change.payload.val();
            if (!key || !readout) {
              console.log('It seems like we should never see this');
              return null;
            }
            // Could replace temp with dynamic option
            const {
              bme: { temperature },
              moduleId,
              timestamp,
            } = readout;
            return {
              key,
              moduleId,
              temperature,
              timestamp,
            };
          }),
        // map(temperatures => )
      ),
    );

    this.readouts$.subscribe(console.log);
  }

  ngOnInit(): void {}

  moduleClick = (moduleId: string) =>
    this.router.navigate(['modules', moduleId]);
}
