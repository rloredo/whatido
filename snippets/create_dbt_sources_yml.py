#Based by: https://github.com/dbt-labs/dbt-core/issues/1082
from sqlalchemy import create_engine
import pandas as pd 
conn = create_engine('YOUR DB CONNECTION STRING HERE')

db_metadata = pd.read_sql_query("""SELECT table_schema, 
                                          table_name,
                                          column_name,
                                          udt_name AS column_data_type
                                    FROM information_schema."columns"
                                 """, conn)



sources_dict = {}

for schema in db_metadata.table_schema.unique():
    tmp_str = f"version: 2\n\nsources:\n  - name: {schema}\n    tables:\n"
    
    for table in db_metadata.loc[db_metadata.table_schema == schema].table_name.sort_values().unique():
        tmp_str = f"{tmp_str}      - name: {table}\n"
        tmp_str = f"{tmp_str}        description: ''\n"
        tmp_str = f"{tmp_str}        tests:\n"
        tmp_str = f"{tmp_str}        columns:\n"
        
        for column in db_metadata.loc[db_metadata.table_name == table].column_name:
            tmp_str = f"{tmp_str}         - name: {column}\n"
            tmp_str = f"{tmp_str}           description: ''\n"
            tmp_str = f"{tmp_str}           tests:\n"
            #TODO add column data type
            
    #Write each schema to a yml file
    with open(f"PATH_TO_SOURCES_FOLDER/{schema}.yml", 'w') as ymlfile:
        ymlfile.write(tmp_str)
        ymlfile.close()      
    
    #Make a dictionary with the strings. 
    sources_dict.update({f'{schema}': tmp_str})
    #TODO use the dict to compare previous and new yml files, and update them.  