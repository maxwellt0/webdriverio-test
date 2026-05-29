describe('SUT smoke', () => {
    it('loads the Tic-Tac-Toe app', async () => {
        await expect(browser).toHaveTitle('Tic-Tac-Toe');
    });
});