"""Persist normalized event posters in the same backed-up database."""
from alembic import op
import sqlalchemy as sa

revision = '0004_event_images'
down_revision = '0003_catalog'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('catalog_event_images',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('event_id', sa.Integer(), sa.ForeignKey('tbl_barnames.id'), nullable=False, unique=True),
        sa.Column('content', sa.LargeBinary(), nullable=False),
        sa.Column('content_hash', sa.String(64), nullable=False),
        sa.Column('width', sa.Integer(), nullable=False),
        sa.Column('height', sa.Integer(), nullable=False),
        sa.Column('alt', sa.String(500), nullable=False))

def downgrade():
    op.drop_table('catalog_event_images')
