"""Owned reservations, immutable orders and independent seat tickets."""
from alembic import op
import sqlalchemy as sa
revision='0005_sales'
down_revision='0004_event_images'
branch_labels=None
depends_on=None

def upgrade():
    op.create_table('sale_reservations',
        sa.Column('id',sa.String(36),primary_key=True),
        sa.Column('user_id',sa.Integer(),sa.ForeignKey('tbl_user_lists.id'),nullable=False),
        sa.Column('run_turn_id',sa.Integer(),sa.ForeignKey('tbl_run_turns.id'),nullable=False),
        sa.Column('seat_ids_json',sa.Text(),nullable=False),
        sa.Column('expires_at',sa.DateTime(),nullable=False),
        sa.Column('status',sa.String(30),nullable=False))
    op.create_index('ix_sale_reservations_user_id','sale_reservations',['user_id'])
    with op.batch_alter_table('tbl_chair_in_barname') as batch:
        batch.add_column(sa.Column('reservation_id',sa.String(36),nullable=True))
        batch.create_foreign_key('fk_chair_reservation','sale_reservations',['reservation_id'],['id'])
        batch.create_index('ix_chair_reservation',['reservation_id'])
    op.create_table('sale_orders',
        sa.Column('id',sa.String(36),primary_key=True),
        sa.Column('reservation_id',sa.String(36),sa.ForeignKey('sale_reservations.id'),nullable=False,unique=True),
        sa.Column('user_id',sa.Integer(),sa.ForeignKey('tbl_user_lists.id'),nullable=False),
        sa.Column('amount_irr',sa.BigInteger(),nullable=False),
        sa.Column('items_json',sa.Text(),nullable=False),
        sa.Column('status',sa.String(30),nullable=False),
        sa.Column('created_at',sa.DateTime(),nullable=False),
        sa.Column('authority',sa.String(100),nullable=True,unique=True),
        sa.Column('ref_id',sa.String(100),nullable=True,unique=True),
        sa.Column('gateway_mode',sa.String(10),nullable=True),
        sa.Column('paid_at',sa.DateTime(),nullable=True))
    op.create_index('ix_sale_orders_user_id','sale_orders',['user_id'])
    op.create_table('sale_tickets',
        sa.Column('id',sa.String(64),primary_key=True),
        sa.Column('order_id',sa.String(36),sa.ForeignKey('sale_orders.id'),nullable=False),
        sa.Column('seat_id',sa.Integer(),sa.ForeignKey('tbl_chair_in_barname.id'),nullable=False,unique=True),
        sa.Column('checked_in_at',sa.DateTime(),nullable=True))
    op.create_index('ix_sale_tickets_order_id','sale_tickets',['order_id'])

def downgrade():
    op.drop_table('sale_tickets');op.drop_table('sale_orders')
    with op.batch_alter_table('tbl_chair_in_barname') as batch:
        batch.drop_index('ix_chair_reservation')
        batch.drop_constraint('fk_chair_reservation',type_='foreignkey')
        batch.drop_column('reservation_id')
    op.drop_table('sale_reservations')
