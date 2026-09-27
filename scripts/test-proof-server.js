async function testPorts() {
  for (const port of [6300, 6302]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}`);
      console.log(`Port ${port}: HTTP ${res.status}`);
    } catch (e) {
      console.log(`Port ${port}: ${e.message}`);
    }
  }
}
testPorts();
