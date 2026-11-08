"""Import every mapped class so SQLAlchemy can resolve relationship names."""

from model.admin_user_model import AdminUserModel
from model.content_dataset_version_model import ContentDatasetVersionModel
from model.menu_item_model import MenuItemModel
from model.poi_category_model import PoiCategoryModel
from model.poi_localization_model import PoiLocalizationModel
from model.poi_model import PoiModel
from model.poi_owner_registration_model import PoiOwnerRegistrationModel
from model.poi_submission_model import PoiSubmissionModel
from model.poi_task_event_model import PoiTaskEventModel
from model.poi_task_process_model import PoiTaskProcessModel
from model.poi_task_model import PoiTaskModel
from model.role_model import RoleModel

__all__ = [
    "AdminUserModel",
    "ContentDatasetVersionModel",
    "MenuItemModel",
    "PoiCategoryModel",
    "PoiLocalizationModel",
    "PoiModel",
    "PoiOwnerRegistrationModel",
    "PoiSubmissionModel",
    "PoiTaskEventModel",
    "PoiTaskModel",
    "PoiTaskProcessModel",
    "RoleModel",
]
