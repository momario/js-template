export default class App1 {
  async home() {
    let rtr = this.router;
    await rtr.loadView('home');
  }

  async test() {
    let rtr = this.router;
    await rtr.loadView('test');
  }
}