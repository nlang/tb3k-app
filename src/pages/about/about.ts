import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';
import * as ical from "ical";

@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {

  events: any[] = [{summary: "OI"}];

  constructor(public navCtrl: NavController) {

  }

  ionViewDidEnter() {
    /*
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    // http://www.abfuhrplan-landkreis-neumarkt.de/papier/markt-pyrbaum/pyrbaum-1.ics
    // http://www.abfuhrplan-landkreis-neumarkt.de/restmuell/markt-pyrbaum/pyrbaum.ics

    ical.fromURL('http://www.abfuhrplan-landkreis-neumarkt.de/gelbersack/markt-pyrbaum/pyrbaum-2.ics', {}, (err, data) => {
      if (err) {
        this.events.push({summary: err.message});
      }
      for (var k in data) {
        if (data.hasOwnProperty(k)) {
          var ev = data[k];
          this.events.push({
            summary: ev.summary,
            day: ev.start.getDate(),
            month: months[ev.start.getMonth()],
          });
        }
      }
    });*/
  }

}
