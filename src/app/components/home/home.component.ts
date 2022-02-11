import { Component, OnInit } from '@angular/core';
// import { Database, ref, listVal } from '@angular/fire/database';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Router } from '@angular/router';
import {
  EChartsOption,
  SeriesOption,
  XAXisComponentOption,
  YAXisComponentOption,
} from 'echarts';
import { combineLatest, map, Observable } from 'rxjs';
import { ModuleI, ReadoutI } from 'src/app/models';

const fakeDates = () => {
  const dates = [];
  for (let i = 0; i < 100; i++) {
    dates.push(new Date().setDate(new Date().getDate() + i));
  }
  return dates;
};

@Component({
  selector: 'sen-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  modules$: Observable<ModuleI[]>;
  chartOption$: Observable<EChartsOption>;

  dates = fakeDates();

  tooltipTestChartOption: EChartsOption;

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
    // TESTING
    this.tooltipTestChartOption = {
      tooltip: {
        trigger: 'axis',
      },
      xAxis: {
        type: 'time',
      },
      yAxis: {
        type: 'value',
        name: 'testing',
      },
      series: [
        {
          type: 'line',
          data: this.dates.map(date => [date, Math.random() * 100]),
          name: 't1',
        },
        {
          type: 'line',
          data: this.dates.map(date => [date, Math.random() * 100]),
          name: 't2',
        },
      ],
      // legend: {
      //   data: ['Readout'],
      // },
    };
    // end testing
    // modular
    // const modulesNode = ref(db, 'modules');
    // this.modules$ = listVal<ModuleI>(modulesNode, { keyField: 'id' });

    // const readoutsNode = db.list<ReadoutI>('readouts', ref =>
    //   ref.orderByChild('timestamp').limitToLast(50000),
    // );
    // const readouts$ = readoutsNode.snapshotChanges().pipe(
    //   map(changes =>
    //     changes.map(change => {
    //       const { key } = change.payload;
    //       const readout = change.payload.val();
    //       if (!key || !readout) {
    //         throw new Error('It seems like we should never see this');
    //       }
    //       // Could replace temp with dynamic option
    //       const {
    //         bme: { temperature },
    //         moduleId,
    //         timestamp,
    //       } = readout;
    //       return {
    //         key,
    //         moduleId,
    //         temperature,
    //         timestamp,
    //       };
    //     }),
    //   ),
    // );

    // this.chartOption$ = combineLatest([this.modules$, readouts$]).pipe(
    //   map(([modules, readouts]) => {
    //     // const xAxis: XAXisComponentOption[] = modules.map(module => ({
    //     //   type: 'category',
    //     //   data: readouts
    //     //     .filter(readout => readout.moduleId === module.id)
    //     //     .map(readout => new Date(readout.timestamp).toLocaleTimeString()),
    //     //   axisTick: {
    //     //     alignWithLabel: false,
    //     //   },
    //     // }));
    //     const xAxis: XAXisComponentOption[] = modules.map(module => ({
    //       type: 'time',
    //       axisLabel: {
    //         formatter: function (value: number) {
    //           let date = new Date(value);
    //           if (date.getHours() === 0) {
    //             return date.toLocaleDateString();
    //           }

    //           return date.toLocaleTimeString();
    //         },
    //       },
    //     }));
    //     const yAxis: YAXisComponentOption = {
    //       type: 'value',
    //       name: 'Temperature',
    //     };
    //     const selectedSeries: SeriesOption[] = modules.map(module => {
    //       const moduleReadouts = readouts.filter(
    //         readout => readout.moduleId === module.id,
    //       );
    //       // const tempAndTimestamp = moduleReadouts.map(
    //       //   readout => readout.temperature,
    //       // );
    //       const tempAndTimestamp = moduleReadouts.map(readout => [
    //         readout.timestamp,
    //         readout.temperature,
    //       ]);
    //       const series: SeriesOption = {
    //         type: 'line',
    //         data: tempAndTimestamp,
    //         name: module.name,
    //       };
    //       return series;
    //     });

    //     const chartOption: EChartsOption = {
    //       tooltip: {
    //         trigger: 'item',
    //         axisPointer: {
    //           type: 'line',
    //           axis: 'x',
    //         },
    //         displayMode: 'single',
    //       },
    //       yAxis,
    //       xAxis,
    //       series: selectedSeries,
    //     };
    //     return chartOption;
    //   }),
    // );
  }

  ngOnInit(): void {}

  moduleClick = (moduleId: string) =>
    this.router.navigate(['modules', moduleId]);
}
