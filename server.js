(function() {
    if (input) {
        var action = input.action;

        if (action === 'getBoards') {
            data.boards = getBoards();
        }

        if (action === 'getAutomations') {
            data.automations = getAutomations(input.boardId);
        }

        if (action === 'checkAndCopyAutomations') {
            var sourceBoardId = input.sourceBoardId;
            var destBoardId = input.destBoardId;
            var overwrite = input.overwrite === true;
            data.result = checkAndCopyAutomations(sourceBoardId, destBoardId, overwrite);
        }
    } else {
        data.boards = getBoards();
    }

    function getBoards() {
        var boards = [];
        var userId = gs.getUserID();

        // GlideRecordSecure enforces ACLs - only returns boards the user can read
        var boardGr = new GlideRecordSecure('sn_cwm_board');
        boardGr.addActiveQuery();
        boardGr.orderBy('name');
        boardGr.query();

        while (boardGr.next()) {
            boards.push({
                sys_id: boardGr.getUniqueValue(),
                name: boardGr.getDisplayValue('name') || boardGr.getDisplayValue(),
                space_name: boardGr.getDisplayValue('space')
            });
        }
        return boards;
    }

    function getAutomations(boardId) {
        var automations = [];
        if (!boardId) return automations;

        var gr = new GlideRecord('sn_cwm_automation');
        gr.addQuery('board', boardId);
        gr.orderBy('order');
        gr.query();

        while (gr.next()) {
            var type = gr.getValue('type') || '';
            var subType = gr.getValue('sub_type') || '';
            var triggerCol = gr.getValue('trigger_column') || '';
            var triggerVal = gr.getValue('trigger_col_value') || '';
            var updateCol = gr.getValue('update_column') || '';
            var updateVal = gr.getValue('update_col_value') || '';
            var active = gr.getValue('active') === '1';

            // Build a human-readable summary
            var summary = '';
            if (type === 'update') {
                summary = 'When "' + triggerCol + '"';
                if (subType === 'changes_to' && triggerVal) {
                    summary += ' changes to "' + triggerVal + '"';
                } else {
                    summary += ' changes';
                }
                summary += ', set "' + updateCol + '"';
                if (updateVal) {
                    summary += ' to "' + updateVal + '"';
                }
            } else if (type === 'notify' || type === 'email') {
                summary = 'When "' + triggerCol + '"';
                if (subType === 'changes_to' && triggerVal) {
                    summary += ' changes to "' + triggerVal + '"';
                } else {
                    summary += ' changes';
                }
                summary += ', send ' + type;
            } else if (type === 'date_based_notify' || type === 'date_based_email') {
                var offset = gr.getValue('offset') || '0';
                var timeSpan = gr.getValue('time_span') || '';
                summary = 'When "' + triggerCol + '" date arrives';
                if (offset !== '0') {
                    summary += ' (offset: ' + offset + ' ' + timeSpan + ')';
                }
                summary += ', send ' + (type === 'date_based_email' ? 'email' : 'notification');
            } else {
                summary = type + ' on "' + triggerCol + '"';
            }

            automations.push({
                sys_id: gr.getUniqueValue(),
                type: type,
                active: active,
                summary: summary
            });
        }
        return automations;
    }

    function checkAndCopyAutomations(sourceBoardId, destBoardId, overwrite) {
        if (!sourceBoardId || !destBoardId) {
            return {
                status: 'error',
                message: 'Please select both a source and destination board.'
            };
        }

        if (sourceBoardId === destBoardId) {
            return {
                status: 'error',
                message: 'Source and destination boards cannot be the same.'
            };
        }

        var removedCount = 0;

        // Check if destination board already has automations
        var destAutoGr = new GlideRecord('sn_cwm_automation');
        destAutoGr.addQuery('board', destBoardId);
        destAutoGr.setLimit(1);
        destAutoGr.query();

        if (destAutoGr.hasNext()) {
            if (!overwrite) {
                return {
                    status: 'error',
                    message: 'Destination board already has automations. Enable "Overwrite" to replace them.'
                };
            }

            var deleteGr = new GlideRecord('sn_cwm_automation');
            deleteGr.addQuery('board', destBoardId);
            deleteGr.query();
            while (deleteGr.next()) {
                removedCount++;
                deleteGr.deleteRecord();
            }
        }

        // Fetch source automations
        var sourceAutoGr = new GlideRecord('sn_cwm_automation');
        sourceAutoGr.addQuery('board', sourceBoardId);
        sourceAutoGr.addQuery('active', true);
        sourceAutoGr.addQuery('is_corrupted', false);
        sourceAutoGr.query();

        if (!sourceAutoGr.hasNext()) {
            return {
                status: 'error',
                message: 'Source board has no active automations to copy.'
            };
        }

        var copiedCount = 0;
        var fields = [
            'type', 'sub_type', 'trigger_column', 'trigger_col_value',
            'trigger_table', 'update_table', 'update_column', 'update_col_value',
            'task_filter_conditions', 'task_custom_filter_conditions',
            'offset', 'time_span', 'recipients_users', 'recipients_group',
            'recipients_type', 'recipients_fields', 'order'
        ];

        while (sourceAutoGr.next()) {
            var newAutoGr = new GlideRecord('sn_cwm_automation');
            newAutoGr.initialize();
            newAutoGr.setValue('board', destBoardId);
            newAutoGr.setValue('active', true);
            newAutoGr.setValue('is_corrupted', false);

            for (var i = 0; i < fields.length; i++) {
                var val = sourceAutoGr.getValue(fields[i]);
                if (val !== null) {
                    newAutoGr.setValue(fields[i], val);
                }
            }

            newAutoGr.insert();
            copiedCount++;
        }

        return {
            status: 'success',
            message: 'Successfully copied ' + copiedCount + ' automation(s) to the destination board.' + (removedCount > 0 ? ' Removed ' + removedCount + ' existing automation(s).' : ''),
            copiedCount: copiedCount,
            removedCount: removedCount
        };
    }
})();
