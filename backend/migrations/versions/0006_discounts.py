"""Discount claims and immutable receipt identity; legacy discounts remain untouched."""
from alembic import op
import sqlalchemy as sa
revision='0006_discounts'
down_revision='0005_sales'
branch_labels=None
depends_on=None
def upgrade():
    op.create_table('sale_discounts',
        sa.Column('id',sa.String(36),primary_key=True),sa.Column('code',sa.String(40),nullable=False,unique=True),
        sa.Column('event_id',sa.Integer(),sa.ForeignKey('tbl_barnames.id'),nullable=True),
        sa.Column('run_turn_id',sa.Integer(),sa.ForeignKey('tbl_run_turns.id'),nullable=True),
        sa.Column('percent',sa.Integer(),nullable=True),sa.Column('fixed_amount_irr',sa.BigInteger(),nullable=True),
        sa.Column('min_seats',sa.Integer(),nullable=False),sa.Column('max_uses',sa.Integer(),nullable=False),
        sa.Column('starts_at',sa.DateTime(),nullable=False),sa.Column('ends_at',sa.DateTime(),nullable=False),
        sa.Column('is_active',sa.Boolean(),nullable=False))
    with op.batch_alter_table('sale_orders') as batch:
        batch.add_column(sa.Column('subtotal_irr',sa.BigInteger(),nullable=False,server_default='0'))
        batch.add_column(sa.Column('discount_amount_irr',sa.BigInteger(),nullable=False,server_default='0'))
        batch.add_column(sa.Column('discount_id',sa.String(36),nullable=True))
        batch.add_column(sa.Column('discount_code',sa.String(40),nullable=True))
        batch.add_column(sa.Column('customer_name',sa.String(150),nullable=False,server_default=''))
        batch.add_column(sa.Column('customer_mobile',sa.String(20),nullable=False,server_default=''))
        batch.create_foreign_key('fk_order_discount','sale_discounts',['discount_id'],['id'])
    with op.batch_alter_table('sale_tickets') as batch:
        batch.add_column(sa.Column('checked_by',sa.Integer(),nullable=True))
        batch.create_foreign_key('fk_ticket_checker','tbl_user_lists',['checked_by'],['id'])
    op.execute(sa.text('UPDATE sale_orders SET subtotal_irr=amount_irr'))
    op.execute(sa.text('UPDATE sale_orders SET customer_name=(SELECT full_name FROM tbl_user_lists WHERE id=sale_orders.user_id), customer_mobile=(SELECT mobile FROM tbl_user_lists WHERE id=sale_orders.user_id)'))
def downgrade():
    with op.batch_alter_table('sale_tickets') as batch:
        batch.drop_constraint('fk_ticket_checker',type_='foreignkey')
        batch.drop_column('checked_by')
    with op.batch_alter_table('sale_orders') as batch:
        batch.drop_constraint('fk_order_discount',type_='foreignkey')
        for name in ('customer_mobile','customer_name','discount_code','discount_id','discount_amount_irr','subtotal_irr'):batch.drop_column(name)
    op.drop_table('sale_discounts')
