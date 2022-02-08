import { Component } from '@angular/core';
// import {
//   Database,
//   equalTo,
//   listVal,
//   objectVal,
//   orderByChild,
//   query,
//   ref,
//   set,
// } from '@angular/fire/database';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { ActivatedRoute } from '@angular/router';
import {
  EChartsOption,
  XAXisComponentOption,
  YAXisComponentOption,
  SeriesOption,
} from 'echarts';
import { combineLatest, map, Observable, switchMap } from 'rxjs';
import { ModuleI, ReadoutI } from 'src/app/models';

@Component({
  selector: 'sen-module-overview',
  templateUrl: './module-overview.component.html',
  styleUrls: ['./module-overview.component.scss'],
})
export class ModuleOverviewComponent {
  //! querying is sooo bad with rtdb maybe I really should just go with firestore
  chartOption$: Observable<EChartsOption>;

  constructor(
    private activeRoute: ActivatedRoute,
    private db: AngularFireDatabase,
  ) {
    this.chartOption$ = this.activeRoute.params.pipe(
      map(params => params['id']),
      switchMap((id: string) => {
        const module$ = this.db.object<ModuleI>(`modules/${id}`).valueChanges();
        const readouts$ = this.db
          .list<ReadoutI>('readouts', ref =>
            ref.orderByChild('moduleId').equalTo(id),
          )
          .valueChanges();
        return combineLatest([module$, readouts$]);
      }),
      map(([module, readouts]) => {
        if (!readouts) {
          return {};
        }
        // const timestamps = readouts.map(readout => new Date(readout.timestamp).getMinutes());
        // const timestamps = readouts.map(readout => {
        //   const time = new Date(readout.timestamp);
        //   return time.toLocaleTimeString();
        // });
        const humidity = readouts.map(readout => [
          readout.timestamp,
          readout.bme.humidity,
        ]);
        const temperature = readouts.map(readout => [
          readout.timestamp,
          readout.bme.temperature,
        ]);
        const yAxisHumidity: YAXisComponentOption = {
          type: 'value',
          name: 'Humidity',
        };
        const yAxisTemperature: YAXisComponentOption = {
          name: 'Temperature',
          alignTicks: true,
          type: 'value',
        };
        const yAxis: YAXisComponentOption[] = [yAxisHumidity, yAxisTemperature];
        const xAxis: XAXisComponentOption = {
          type: 'time',
          // data: timestamps,
          alignTicks: true,
        };
        const humiditySeries: SeriesOption = {
          name: 'Humidity',
          type: 'line',
          data: humidity,
        };
        const temperatureSeries: SeriesOption = {
          name: 'Temperature',
          type: 'line',
          data: temperature,
          yAxisIndex: 1,
        };
        const series: SeriesOption[] = [humiditySeries, temperatureSeries];
        const chartOption: EChartsOption = {
          title: {
            text: `${module?.name} - Humidity vs Temperature`,
            left: 'center',
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'cross',
            },
          },
          yAxis,
          xAxis,
          series,
        };
        return chartOption;
      }),
    );
    // BUGGY AF (modular style):
    // Returns values and empty arrays intermittently so far not exceeding 3 empty in a row depending on interval length
    // this.activeRoute.params
    //   .pipe(
    //     map(params => params['id']),
    //     filter(id => !!id),
    //   )
    //   .subscribe(id => {
    //     const readoutsRef = ref(this.db, 'readouts');
    //     const moduleQuery = query(
    //       readoutsRef,
    //       orderByChild('moduleId'),
    //       equalTo(id),
    //     );
    //     interval(5000).subscribe(() => {
    //       listVal(moduleQuery).subscribe(console.log);
    //     });
    //   });
    // this.chartOption$ = this.activeRoute.params.pipe(
    //   map(params => params['id']),
    //   switchMap(id =>
    //     // Super-weird bug where subsequent navigation can return empty array
    //     // Logging a static subscription to the query on its own showed that it would
    //     // actually clear out one item at at time returning shringking arrays then never work again...
    //     // listVal<ReadoutI>(
    //     //   query(
    //     //     ref(this.db, 'readouts'),
    //     //     orderByChild('moduleId'),
    //     //     equalTo(id),
    //     //   ),
    //     // ),
    //   ),
    //   map(readouts => {
    //     console.log(readouts);
    //     if (!readouts) {
    //       return {};
    //     }
    //     // const timestamps = readouts.map(readout => new Date(readout.timestamp).getMinutes());
    //     const timestamps = readouts.map(readout => readout.timestamp);
    //     const humidity = readouts.map(readout => readout.bme.humidity);
    //     const temperature = readouts.map(readout => readout.bme.temperature);
    //     const yAxis: YAXisComponentOption = {
    //       type: 'value',
    //     };
    //     const xAxis: XAXisComponentOption = {
    //       type: 'category',
    //       data: timestamps,
    //     };
    //     const humiditySeries: SeriesOption = {
    //       type: 'line',
    //       data: humidity,
    //     };
    //     const temperatureSeries: SeriesOption = {
    //       type: 'line',
    //       data: temperature,
    //     };
    //     const series: SeriesOption[] = [humiditySeries, temperatureSeries];
    //     const chartOption: EChartsOption = {
    //       yAxis,
    //       xAxis,
    //       series,
    //     };
    //     return chartOption;
    //   }),
    // );
  }
}
