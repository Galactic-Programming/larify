import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Circle, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import type { Project, TaskList } from '../../lib/types';
import { getPriorityColor, getTaskStatusIcon } from '../../lib/utils';
import { CreateListDialog } from '../create-list-dialog';
import { ListDropdownMenu } from '../list-dropdown-menu';

interface TableViewProps {
    project: Project;
    onEditList: (list: TaskList) => void;
    onDeleteList: (list: TaskList) => void;
}

export function TableView({ project, onEditList, onDeleteList }: TableViewProps) {
    return (
        <ScrollArea className="flex-1">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-lg border bg-card"
            >
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-10">Status</TableHead>
                            <TableHead>Task</TableHead>
                            <TableHead className="w-32">List</TableHead>
                            <TableHead className="w-24">Priority</TableHead>
                            <TableHead className="w-28">Due Date</TableHead>
                            <TableHead className="w-10"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {project.lists.flatMap((list) =>
                            list.tasks.map((task) => (
                                <TableRow key={task.id} className="group">
                                    <TableCell>{getTaskStatusIcon(task)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span
                                                className={`font-medium ${task.completed_at ? 'text-muted-foreground line-through' : ''}`}
                                            >
                                                {task.title}
                                            </span>
                                            {task.description && (
                                                <span className="line-clamp-1 text-xs text-muted-foreground">
                                                    {task.description}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="size-2 rounded-full"
                                                style={{ backgroundColor: project.color }}
                                            />
                                            <span className="text-sm text-muted-foreground">{list.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={`text-xs ${getPriorityColor(task.priority)}`}
                                        >
                                            {task.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {task.due_date ? (
                                            <span className="text-sm text-muted-foreground">
                                                {new Date(task.due_date).toLocaleDateString()}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground/50">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="opacity-0 group-hover:opacity-100"
                                        >
                                            <MoreHorizontal className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )),
                        )}
                        {project.lists.every((list) => list.tasks.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Circle className="size-8 text-muted-foreground/30" />
                                        <p className="text-sm text-muted-foreground">No tasks yet</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </motion.div>

            {/* Lists summary and add button */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-4 flex items-center justify-between rounded-lg border bg-muted/30 p-4"
            >
                <div className="flex flex-wrap gap-2">
                    {project.lists.map((list) => (
                        <div key={list.id} className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1.5">
                                <div
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: project.color }}
                                />
                                {list.name}
                                <span className="text-muted-foreground">({list.tasks.length})</span>
                            </Badge>
                            <ListDropdownMenu
                                project={project}
                                list={list}
                                onEdit={onEditList}
                                onDelete={onDeleteList}
                                triggerClassName="size-5"
                            />
                        </div>
                    ))}
                </div>
                <CreateListDialog project={project} />
            </motion.div>
        </ScrollArea>
    );
}
