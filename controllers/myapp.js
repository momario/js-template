export default class Myapp {
  async home() {
    let rtr = this.router;
    await rtr.loadView('test');
  }

  async other() {
    document.write('Hello World!');
  }
}