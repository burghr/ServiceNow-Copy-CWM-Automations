function CWMCopyAutomationsController($scope) {
    var c = this;

    c.boards = c.data.boards || [];
    c.sourceBoardId = '';
    c.destBoardId = '';
    c.overwrite = false;
    c.loading = false;
    c.result = null;
    c.sourceAutomations = [];
    c.destAutomations = [];
    c.loadingSource = false;
    c.loadingDest = false;

    // Filter out the selected source from destination options and vice versa
    c.getSourceBoards = function() {
        return c.boards.filter(function(b) {
            return b.sys_id !== c.destBoardId;
        });
    };

    c.getDestBoards = function() {
        return c.boards.filter(function(b) {
            return b.sys_id !== c.sourceBoardId;
        });
    };

    // Fetch automations when source board changes
    $scope.$watch('c.sourceBoardId', function(newVal) {
        c.sourceAutomations = [];
        c.result = null;
        if (!newVal) return;

        c.loadingSource = true;
        c.server.get({
            action: 'getAutomations',
            boardId: newVal
        }).then(function(response) {
            c.sourceAutomations = response.data.automations || [];
            c.loadingSource = false;
        });
    });

    // Fetch automations when destination board changes
    $scope.$watch('c.destBoardId', function(newVal) {
        c.destAutomations = [];
        c.result = null;
        if (!newVal) return;

        c.loadingDest = true;
        c.server.get({
            action: 'getAutomations',
            boardId: newVal
        }).then(function(response) {
            c.destAutomations = response.data.automations || [];
            c.loadingDest = false;
        });
    });

    c.copyAutomations = function() {
        if (!c.sourceBoardId || !c.destBoardId) {
            c.result = {
                status: 'error',
                message: 'Please select both a source and destination board.'
            };
            return;
        }

        c.loading = true;
        c.result = null;

        c.server.get({
            action: 'checkAndCopyAutomations',
            sourceBoardId: c.sourceBoardId,
            destBoardId: c.destBoardId,
            overwrite: c.overwrite
        }).then(function(response) {
            c.result = response.data.result;
            c.loading = false;

            // Refresh destination automations after copy
            if (c.result && c.result.status === 'success') {
                c.loadingDest = true;
                c.server.get({
                    action: 'getAutomations',
                    boardId: c.destBoardId
                }).then(function(resp) {
                    c.destAutomations = resp.data.automations || [];
                    c.loadingDest = false;
                });
            }
        });
    };

    c.reset = function() {
        c.sourceBoardId = '';
        c.destBoardId = '';
        c.overwrite = false;
        c.result = null;
        c.sourceAutomations = [];
        c.destAutomations = [];
    };
}
