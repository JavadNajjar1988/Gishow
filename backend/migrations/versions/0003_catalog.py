"""Catalog editing without rewriting legacy records or seat identities."""
from alembic import op
import sqlalchemy as sa

revision = '0003_catalog'
down_revision = '0002_accounts'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('tbl_salons', sa.Column('plan_version', sa.Integer(), nullable=False, server_default='0'))
    for table in ('tbl_salons', 'tbl_part_of_salons', 'tbl_barnames', 'tbl_run_turns'):
        op.add_column(table, sa.Column('config_json', sa.Text(), nullable=True))
    with op.batch_alter_table('tbl_run_turns') as batch:
        batch.add_column(sa.Column('salon_id', sa.Integer(), nullable=True))
        batch.create_foreign_key('fk_run_turn_salon', 'tbl_salons', ['salon_id'], ['id'])
    connection = op.get_bind()
    connection.execute(sa.text("INSERT INTO auth_permissions (code,name,scope) VALUES ('events.manage','ویرایش برنامه و سانس','event')"))
    connection.execute(sa.text("INSERT INTO auth_role_permissions (role_id,permission_code) SELECT id,'events.manage' FROM auth_roles WHERE code='admin'"))

def downgrade():
    op.execute(sa.text("DELETE FROM auth_user_permissions WHERE permission_code='events.manage'"))
    op.execute(sa.text("DELETE FROM auth_role_permissions WHERE permission_code='events.manage'"))
    op.execute(sa.text("DELETE FROM auth_permissions WHERE code='events.manage'"))
    with op.batch_alter_table('tbl_run_turns') as batch:
        batch.drop_constraint('fk_run_turn_salon', type_='foreignkey')
        batch.drop_column('salon_id')
    for table in ('tbl_salons', 'tbl_part_of_salons', 'tbl_barnames', 'tbl_run_turns'):
        op.drop_column(table, 'config_json')
    op.drop_column('tbl_salons', 'plan_version')
