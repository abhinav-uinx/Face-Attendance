insert into public.tbl_designation (designation_id, designation_name) values
  (100, 'HOD'),
  (121, 'Asst.professor'),
  (102, 'Senior Professor')
on conflict (designation_id) do update
set designation_name = excluded.designation_name;
