#Based on: https://github.com/dbt-labs/dbt-core/issues/1082
import pandas as pd
import yaml

class SourceMetadata:
    def __init__(self, db_connection_engine):
        self.conn = db_connection_engine
        self.sources_metadata_df = self._get_metadata_df()

    def _get_metadata_df(self) -> pd.DataFrame:
        """
        Get all source metadata from a database.
        """
        db_metadata = pd.read_sql_query("""SELECT table_schema, 
                                                  table_name,
                                                  column_name,
                                                  udt_name AS column_type
                                            FROM information_schema."columns"
                                            """, self.conn)

        return db_metadata
    
    def get_available_schemas(self)->set:
        """
        Return available schemas of the database
        Useful for exclude param
        """
        return set(self.sources_metadata_df.table_schema.unique())

    def get_sources_dict(self, exclude:list = []) -> dict:
        """
        Return a dict with the schema name as key and metadata dictionary as value
        Exclude: list of schemas to exclude
        """
        sources_dict = {}
        for schema in self.sources_metadata_df.loc[~self.sources_metadata_df.table_schema.isin(exclude)].table_schema.unique():
            tmp_table_list = []
            for table in self.sources_metadata_df.loc[self.sources_metadata_df.table_schema == schema].table_name.sort_values().unique():
                tmp_column_list = []
                for column in self.sources_metadata_df.loc[(self.sources_metadata_df.table_name == table) & (self.sources_metadata_df.table_schema == schema)].column_name.sort_values():                
                    tmp_column_list.append({"name":column, "description": "", "tests": None})
                tmp_table_list.append({"name": table, "description":"", "tests": None, "columns": tmp_column_list})
            sources_dict.update({f"{schema}": {"version":2, "sources": [{"name": schema, "tables": tmp_table_list}]}})
        return sources_dict

    def write_to_yml(self, sources_folder_path:str= '.', exclude:list = [])->None:
        """
        Write one yml file per schema in the database
        """
        sources_dict = self.get_sources_dict(exclude)
        for schema in sources_dict.keys():
            with open(f'{sources_folder_path}/{schema}.yml', 'w') as outfile:
                yaml.dump(sources_dict.get(schema), outfile, Dumper=IndentedDumper, sort_keys=False)
       
#Solution to indent the yaml properly.
#See: https://stackoverflow.com/a/39681672
class IndentedDumper(yaml.Dumper):
    def increase_indent(self, flow=False, indentless=False):
        return super(IndentedDumper, self).increase_indent(flow, False)

if __name__ == '__main__':
    from sqlalchemy import create_engine
    conn = create_engine('YOUR DB CONNECTION STRING HERE')
    MyDB = SourceMetadata(conn)  
    MyDB.write_to_yml()