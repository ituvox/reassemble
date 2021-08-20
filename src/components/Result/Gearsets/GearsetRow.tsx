import { Box, IconButton, TableCell, TableRow, TextField, Tooltip, Typography } from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/Delete'
import DoneIcon from '@material-ui/icons/Done'
import EditIcon from '@material-ui/icons/Edit'
import FileCopyIcon from '@material-ui/icons/FileCopy'
import * as React from 'react'
import { Stats } from 'simulator/entity/player/stats'
import { formatDamage } from 'utilities/format'
import { GearsetInfo } from '../Result'
import styles from './GearsetTable.module.css'

const TIERED_COLORS = [
    {
        TIER: 0.02,
        NEGATIVE: 'hsl(0, 60%, 60%)',
        POSITIVE: 'hsl(120, 60%, 60%)',
    },
    {
        TIER: 0.01,
        NEGATIVE: 'hsl(40, 60%, 60%)',
        POSITIVE: 'hsl(150, 60%, 60%)',
    },
    {
        TIER: 0.0002,
        NEGATIVE: 'hsl(55, 60%, 60%)',
        POSITIVE: 'hsl(170, 60%, 60%)',
    },
    {
        TIER: 0,
        POSITIVE: 'hsl(0, 0%, 100%)',
    },
]

interface Props {
    gearset: GearsetInfo
    selected: GearsetInfo
    stats: Array<keyof Stats>
    selectRow: (gearset: GearsetInfo) => Promise<void>
    removeGearset: (gearsetID: string) => Promise<void>
    updateGearset: (gearsetID: string, stats: Stats, name: string) => Promise<void>
    cloneGearset: (gearsetID: string) => Promise<void>
}

interface State {
    editMode: boolean
    editedStats: Stats
    editedName: string
}

export class GearsetRow extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props)
        this.state = {
            editMode: false,
            editedStats: {...props.gearset.stats},
            editedName: props.gearset.name,
        }
    }

    private onStatChange(stat: keyof Stats) {
        return (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = parseInt(event.target.value)

            if (Number.isNaN(newValue) || newValue < 0) {
                return
            }

            const editedStats = {...this.state.editedStats}
            editedStats[stat] = newValue

            this.setState({ editedStats: editedStats })
        }
    }

    private onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ editedName: event.target.value })
    }

    private onEdit = () => {
        this.props.updateGearset(this.props.gearset.id, this.state.editedStats, this.state.editedName)
        this.setState({ editMode: false })
    }

    private renderRelativeDamage() {
        const expected = this.props.gearset.expected
        const compare = this.props.selected.expected
        const delta = (expected - compare) / compare

        const tier = TIERED_COLORS.find(t => Math.abs(delta) >= t.TIER)
        const color = delta < 0 ? tier.NEGATIVE : tier.POSITIVE

        let relative: string

        if (delta === 0) {
            relative = '-'
        } else {
            relative = `${(delta * 100).toFixed(2)}%`
        }

        return <span>
            <Box style={{ color: color }}>
                <Typography>
                    {relative}
                </Typography>
            </Box>
        </span>
    }

    render() {
        const set = this.props.gearset

        return <TableRow
            selected={this.state.editMode}
            onClick={() => this.props.selectRow(this.props.gearset)}
        >
            <TableCell className={styles.name}>
                {this.state.editMode ?
                    <TextField
                        size="small"
                        defaultValue={set.name}
                        fullWidth
                        onChange={this.onNameChange}
                    />
                    : <Typography>
                        {set.name}
                    </Typography>
                }
            </TableCell>
            <TableCell className={styles.relative} align="center">
                {this.renderRelativeDamage()}
            </TableCell>
            <TableCell className={styles.expected} align="center">
                <Typography>
                    {formatDamage(set.expected)}
                </Typography>
            </TableCell>
            {this.props.stats.map(stat =>
                <TableCell key={stat} className={styles.stat} align="center">
                    {this.state.editMode ?
                        <TextField
                            size="small"
                            type="number"
                            defaultValue={set.stats[stat]}
                            InputProps={{ style: { fontSize: 14 } }}
                            onChange={this.onStatChange(stat)}
                        />
                        : <Typography>
                            {set.stats[stat]}
                        </Typography>
                    }
                </TableCell>
            )}
            <TableCell className={styles.actions} align="center">
                {this.state.editMode ?
                    <Tooltip title="Save">
                        <IconButton size="small" onClick={this.onEdit}>
                            <DoneIcon />
                        </IconButton>
                    </Tooltip>
                    : <>
                        <Tooltip title="Edit" onClick={() => this.setState({ editMode: true })}>
                            <IconButton size="small">
                                <EditIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Clone">
                            <IconButton size="small" onClick={() => this.props.cloneGearset(set.id)}>
                                <FileCopyIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                            <IconButton size="small" onClick={() => this.props.removeGearset(set.id)}>
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </>}
            </TableCell>
        </TableRow>
    }
}